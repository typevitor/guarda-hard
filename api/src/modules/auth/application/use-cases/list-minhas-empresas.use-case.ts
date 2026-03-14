import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ListMinhasEmpresasUseCase {
  constructor(
    @Inject(AuthService)
    private readonly authService: Pick<AuthService, 'listMinhasEmpresas'>,
  ) {}

  execute(userId: string): Promise<Array<{ id: string; nome: string }>> {
    return this.authService.listMinhasEmpresas(userId);
  }
}
