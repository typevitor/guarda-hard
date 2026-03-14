import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '../../../tenant/application/tenant-context';

type RequestWithAuth = {
  authUser?: {
    userId: string;
    empresaId?: string;
  };
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const empresaId = request.authUser?.empresaId;

    if (!empresaId) {
      return next.handle();
    }

    return this.tenantContext.run(empresaId, () => next.handle());
  }
}
