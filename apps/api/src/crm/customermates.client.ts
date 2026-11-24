import { randomUUID } from "node:crypto";
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { getEnv } from "../config/env.js";
import { assertSafeResolvedTarget } from "./crm-security.utils.js";

export type CustomerMatesResource =
  | "contacts"
  | "organizations"
  | "deals"
  | "services"
  | "tasks";

export interface CustomerMatesConnectionContext {
  organizationId: string;
  baseUrl: string;
  workspaceId: string | null;
  apiKey: string;
  sandboxMode: boolean;
}

export type CrmRecord = Record<string, unknown> & { id: string };

@Injectable()
export class CustomerMatesClient {
  private readonly sandboxStore = new Map<
    string,
    Map<CustomerMatesResource, Map<string, CrmRecord>>
  >();

  private getOrgSandboxBucket(
    organizationId: string,
    resource: CustomerMatesResource,
  ): Map<string, CrmRecord> {
    let orgMap = this.sandboxStore.get(organizationId);
    if (!orgMap) {
      orgMap = new Map();
      this.sandboxStore.set(organizationId, orgMap);
    }
    let resMap = orgMap.get(resource);
    if (!resMap) {
      resMap = new Map();
      orgMap.set(resource, resMap);
    }
    return resMap;
  }

  async pingWorkspace(
    ctx: CustomerMatesConnectionContext,
  ): Promise<{ reachable: boolean; mode: "live" | "sandbox"; detail: string }> {
    if (ctx.sandboxMode) {
      return {
        reachable: true,
        mode: "sandbox",
        detail: "CustomerMates sandbox mode verified.",
      };
    }

    const env = getEnv();
    await assertSafeResolvedTarget(ctx.baseUrl, env.CRM_ALLOW_PRIVATE_URLS);

    try {
      const response = await this.performFetch(ctx, "/api/v1/contacts?limit=1", {
        method: "GET",
      });
      if (response.ok) {
        return {
          reachable: true,
          mode: "live",
          detail: `Connected to CustomerMates (${response.status}).`,
        };
      }
      return {
        reachable: false,
        mode: "live",
        detail: `CustomerMates returned HTTP ${response.status}.`,
      };
    } catch (error) {
      return {
        reachable: false,
        mode: "live",
        detail:
          error instanceof Error ? error.message : "Connection attempt failed.",
      };
    }
  }

  async listResources(
    ctx: CustomerMatesConnectionContext,
    resource: CustomerMatesResource,
    query: Record<string, string | number | boolean | undefined>,
  ): Promise<Record<string, unknown>> {
    if (ctx.sandboxMode) {
      const store = this.getOrgSandboxBucket(ctx.organizationId, resource);
      let items = Array.from(store.values());
      const search =
        typeof query.search === "string" ? query.search.toLowerCase() : null;
      if (search) {
        items = items.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(search),
        );
      }
      const limit =
        typeof query.limit === "number" ? Math.min(Math.max(query.limit, 1), 100) : 25;
      return {
        items: items.slice(0, limit),
        total: items.length,
        source: "customermates-sandbox",
      };
    }

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v).length > 0) {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    const path = `/api/v1/${resource}${qs ? `?${qs}` : ""}`;
    const data = await this.requestJson(ctx, path, { method: "GET" });

    if (Array.isArray(data)) {
      return { items: data, total: data.length, source: "customermates" };
    }
    if (data && typeof data === "object") {
      return { ...(data as Record<string, unknown>), source: "customermates" };
    }
    return { items: [], source: "customermates" };
  }

  async getResource(
    ctx: CustomerMatesConnectionContext,
    resource: CustomerMatesResource,
    id: string,
  ): Promise<CrmRecord> {
    this.assertSafeResourceId(id);
    if (ctx.sandboxMode) {
      const store = this.getOrgSandboxBucket(ctx.organizationId, resource);
      const found = store.get(id);
      if (!found) {
        throw new NotFoundException(`CustomerMates ${resource} record not found.`);
      }
      return found;
    }

    const data = await this.requestJson(
      ctx,
      `/api/v1/${resource}/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    return data as CrmRecord;
  }

  async createResource(
    ctx: CustomerMatesConnectionContext,
    resource: CustomerMatesResource,
    payload: Record<string, unknown>,
  ): Promise<CrmRecord> {
    if (ctx.sandboxMode) {
      const store = this.getOrgSandboxBucket(ctx.organizationId, resource);
      const id = `cm_${resource.slice(0, 3)}_${randomUUID().slice(0, 12)}`;
      const now = new Date().toISOString();
      const record: CrmRecord = {
        ...payload,
        id,
        workspaceId: ctx.workspaceId ?? "sandbox",
        createdAt: now,
        updatedAt: now,
      };
      store.set(id, record);
      return record;
    }

    const data = await this.requestJson(ctx, `/api/v1/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data as CrmRecord;
  }

  async updateResource(
    ctx: CustomerMatesConnectionContext,
    resource: CustomerMatesResource,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CrmRecord> {
    this.assertSafeResourceId(id);
    if (ctx.sandboxMode) {
      const store = this.getOrgSandboxBucket(ctx.organizationId, resource);
      const existing = store.get(id);
      if (!existing) {
        throw new NotFoundException(`CustomerMates ${resource} record not found.`);
      }
      const updated: CrmRecord = {
        ...existing,
        ...payload,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };
      store.set(id, updated);
      return updated;
    }

    const data = await this.requestJson(
      ctx,
      `/api/v1/${resource}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return data as CrmRecord;
  }

  async deleteResource(
    ctx: CustomerMatesConnectionContext,
    resource: CustomerMatesResource,
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    this.assertSafeResourceId(id);
    if (ctx.sandboxMode) {
      const store = this.getOrgSandboxBucket(ctx.organizationId, resource);
      if (!store.has(id)) {
        throw new NotFoundException(`CustomerMates ${resource} record not found.`);
      }
      store.delete(id);
      return { deleted: true, id };
    }

    await this.requestJson(
      ctx,
      `/api/v1/${resource}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return { deleted: true, id };
  }

  private assertSafeResourceId(id: string): void {
    if (
      !id ||
      id === "." ||
      id === ".." ||
      id.includes("..") ||
      !/^[A-Za-z0-9._:-]{1,128}$/.test(id)
    ) {
      throw new BadRequestException("Invalid CustomerMates resource ID.");
    }
  }

  private async performFetch(
    ctx: CustomerMatesConnectionContext,
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const env = getEnv();
    await assertSafeResolvedTarget(ctx.baseUrl, env.CRM_ALLOW_PRIVATE_URLS);

    const url = `${ctx.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${ctx.apiKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(ctx.workspaceId ? { "X-Workspace-Id": ctx.workspaceId } : {}),
    };

    return fetch(url, {
      ...init,
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(env.CRM_REQUEST_TIMEOUT_MS),
    });
  }

  private async requestJson(
    ctx: CustomerMatesConnectionContext,
    path: string,
    init: RequestInit,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.performFetch(ctx, path, init);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadGatewayException(
        `Unable to reach CustomerMates API: ${
          error instanceof Error ? error.message : "Network error"
        }`,
      );
    }

    if (response.status === 404) {
      throw new NotFoundException("CustomerMates resource was not found.");
    }
    if (response.status === 400 || response.status === 422) {
      const errBody = await response.text().catch(() => "");
      throw new BadRequestException(
        `CustomerMates rejected request (${response.status}): ${errBody.slice(0, 300)}`,
      );
    }
    if (!response.ok) {
      throw new BadGatewayException(
        `CustomerMates API error (HTTP ${response.status}).`,
      );
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text) as unknown;
  }
}
