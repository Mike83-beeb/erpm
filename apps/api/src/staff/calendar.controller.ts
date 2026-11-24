import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { CalendarFeedScope } from "@scace/db";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CurrentTenant,
  RequireActiveTenant,
  RequiredOrgPermissions,
  type AuthenticatedTenant,
} from "../tenancy/tenant.decorators.js";
import { AvailabilityService } from "./availability.service.js";
import { CalendarFeedService } from "./calendar-feed.service.js";

const availabilityQueryBodySchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  departmentId: z.string().trim().min(1).optional(),
  teamId: z.string().trim().min(1).optional(),
  staffIds: z.array(z.string().trim().min(1)).max(100).optional(),
  skills: z.array(z.string().trim().min(1).max(64)).max(25).optional(),
  minTotalFreeMinutes: z.coerce.number().int().min(0).optional(),
  includeBreakdown: z.boolean().optional(),
});

const availabilityGetQuerySchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  departmentId: z.string().trim().min(1).optional(),
  teamId: z.string().trim().min(1).optional(),
  skill: z.string().trim().min(1).max(64).optional(),
  minTotalFreeMinutes: z.coerce.number().int().min(0).optional(),
  includeBreakdown: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const feedScopeEnum = z.enum([
  CalendarFeedScope.STAFF,
  CalendarFeedScope.TEAM,
  CalendarFeedScope.ORGANIZATION,
]);

const calendarEventsQuerySchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  scope: feedScopeEnum.optional(),
  staffId: z.string().trim().min(1).optional(),
  teamId: z.string().trim().min(1).optional(),
  includeTimeOff: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  includeHolidays: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  includeShifts: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const createCalendarFeedSchema = z.object({
  name: z.string().trim().min(1).max(120),
  scope: feedScopeEnum.default(CalendarFeedScope.STAFF),
  staffId: z.string().trim().min(1).nullable().optional(),
  teamId: z.string().trim().min(1).nullable().optional(),
  includeTimeOff: z.boolean().optional(),
  includeHolidays: z.boolean().optional(),
  includeShifts: z.boolean().optional(),
});

const icalTokenQuerySchema = z.object({
  token: z.string().trim().min(16).max(256),
});

@Controller("api/v1")
export class AvailabilityCalendarController {
  constructor(
    @Inject(AvailabilityService)
    private readonly availabilityService: AvailabilityService,
    @Inject(CalendarFeedService)
    private readonly calendarFeedService: CalendarFeedService,
  ) {}

  @Post("availability/query")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ staff: ["read"] })
  async queryAvailabilityPost(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: unknown,
  ) {
    const parsed = availabilityQueryBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid availability query payload.",
        issues: parsed.error.issues,
      });
    }
    return this.availabilityService.queryAvailability(tenant, parsed.data);
  }

  @Get("availability")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ staff: ["read"] })
  async queryAvailabilityGet(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query() query: unknown,
  ) {
    const parsed = availabilityGetQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid availability query parameters.",
        issues: parsed.error.issues,
      });
    }
    return this.availabilityService.queryAvailability(tenant, {
      from: parsed.data.from,
      to: parsed.data.to,
      departmentId: parsed.data.departmentId,
      teamId: parsed.data.teamId,
      skills: parsed.data.skill ? [parsed.data.skill] : undefined,
      minTotalFreeMinutes: parsed.data.minTotalFreeMinutes,
      includeBreakdown: parsed.data.includeBreakdown,
    });
  }

  @Get("calendar/events")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ calendar: ["read"] })
  async getCalendarEvents(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Query() query: unknown,
  ) {
    const parsed = calendarEventsQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid calendar events query parameters.",
        issues: parsed.error.issues,
      });
    }
    return this.availabilityService.getCalendarEvents(tenant, parsed.data);
  }

  @Post("calendar/feeds")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ calendar: ["read"] })
  async createCalendarFeed(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const parsed = createCalendarFeedSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid calendar feed payload.",
        issues: parsed.error.issues,
      });
    }
    return this.calendarFeedService.createFeed(tenant, parsed.data, req.ip);
  }

  @Get("calendar/feeds")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ calendar: ["read"] })
  async listCalendarFeeds(@CurrentTenant() tenant: AuthenticatedTenant) {
    return this.calendarFeedService.listFeeds(tenant);
  }

  @Post("calendar/feeds/:feedId/rotate")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ calendar: ["read"] })
  async rotateCalendarFeed(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("feedId") feedId: string,
    @Req() req: FastifyRequest,
  ) {
    return this.calendarFeedService.rotateFeedToken(tenant, feedId, req.ip);
  }

  @Delete("calendar/feeds/:feedId")
  @RequireActiveTenant()
  @RequiredOrgPermissions({ calendar: ["read"] })
  async revokeCalendarFeed(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Param("feedId") feedId: string,
    @Req() req: FastifyRequest,
  ) {
    return this.calendarFeedService.revokeFeed(tenant, feedId, req.ip);
  }

  @Get("calendar/ical")
  @AllowAnonymous()
  async getIcalFeed(
    @Query() query: unknown,
    @Res() reply: FastifyReply,
  ) {
    const parsed = icalTokenQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("A valid calendar subscription token is required.");
    }

    const ics = await this.calendarFeedService.renderIcalByToken(parsed.data.token);
    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", 'inline; filename="scace-calendar.ics"');
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Cache-Control", "private, max-age=300");
    return reply.send(ics);
  }
}
