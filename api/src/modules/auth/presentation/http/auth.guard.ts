import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionTokenService } from '../../infrastructure/security/session-token.service';

type RequestWithAuth = {
  cookies?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  authUser?: { userId: string; empresaId?: string };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SessionTokenService)
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    const token = this.extractSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = this.sessionTokenService.verify(token);

    if (!payload) {
      throw new UnauthorizedException('Authentication required');
    }

    request.authUser = payload;
    return true;
  }

  private extractSessionToken(request: RequestWithAuth): string | null {
    if (request.cookies?.gh_session) {
      return request.cookies.gh_session;
    }

    const cookieHeader = request.headers.cookie;
    const source = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

    if (!source) {
      return null;
    }

    const parts = source.split(';').map((chunk) => chunk.trim());
    const pair = parts.find((chunk) => chunk.startsWith('gh_session='));

    if (!pair) {
      return null;
    }

    return pair.slice('gh_session='.length);
  }
}
