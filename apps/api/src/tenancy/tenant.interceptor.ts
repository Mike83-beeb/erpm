import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { TenantContext } from "@erp/db";
import { Observable } from "rxjs";
import type { TenantScopedRequest } from "./tenant.decorators.js";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TenantScopedRequest>();
    const organizationId = request.tenant?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException("Active tenant context is missing.");
    }

    return new Observable((subscriber) => {
      let innerSub: { unsubscribe: () => void } | undefined;

      TenantContext.run(organizationId, () => {
        innerSub = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });

      return () => {
        innerSub?.unsubscribe();
      };
    });
  }
}
