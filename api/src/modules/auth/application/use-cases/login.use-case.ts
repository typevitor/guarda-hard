import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AuthService)
    private readonly authService: Pick<AuthService, 'login'>,
  ) {}

  execute(input: {
    email: string;
    senha: string;
  }): Promise<{ userId: string }> {
    return this.authService.login(input);
  }
}
