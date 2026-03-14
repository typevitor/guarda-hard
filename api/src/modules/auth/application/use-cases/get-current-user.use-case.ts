import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(AuthService)
    private readonly authService: Pick<AuthService, 'getCurrentUser'>,
  ) {}

  execute(session: {
    userId: string;
    empresaId?: string;
  }): {
    userId: string;
    empresaId?: string;
  } {
    return this.authService.getCurrentUser(session);
  }
}
