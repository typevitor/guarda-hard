import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class SelectEmpresaUseCase {
  constructor(
    @Inject(AuthService)
    private readonly authService: Pick<AuthService, 'selectEmpresa'>,
  ) {}

  execute(input: { userId: string; empresaId: string }): Promise<{
    userId: string;
    empresaId?: string;
  }> {
    return this.authService.selectEmpresa(input);
  }
}
