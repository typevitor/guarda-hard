import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionTokenService } from '../../infrastructure/security/session-token.service';

type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  authUser?: { userId: string; empresaId?: string };
};

@Injectable()
export class SessionPhaseGuard implements CanActivate {
  constructor(
    @Inject(SessionTokenService)
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractSessionToken(request);

    if (!token) {
      return true;
    }

    const payload = this.sessionTokenService?.verify(token);

    if (!payload?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    request.authUser = payload;

    if (!request.authUser?.empresaId) {
      throw new UnauthorizedException('Tenant selection required');
    }

    return true;
  }

  private extractSessionToken(request: RequestWithAuth): string | null {
    const cookieHeader = request.headers.cookie;
    const source = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

    if (!source) {
      return null;
    }

    const parts = source.split(';').map((chunk) => chunk.trim());
    const pair = parts.find((chunk) => chunk.startsWith('gh_session='));
    return pair ? pair.slice('gh_session='.length) : null;
  }
}
