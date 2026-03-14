import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AuthService)
    private readonly authService: Pick<AuthService, 'register'>,
  ) {}

  execute(input: {
    nome: string;
    email: string;
    senha: string;
    empresaId: string;
  }): Promise<{ userId: string }> {
    return this.authService.register(input);
  }
}
