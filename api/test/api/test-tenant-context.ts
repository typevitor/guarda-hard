import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../src/tenant/application/tenant-context';

@Injectable()
export class TestTenantContext extends TenantContext {
  private empresaId = 'empresa-a';

  setEmpresaId(empresaId: string): void {
    this.empresaId = empresaId;
  }

  override getEmpresaId(): string | null {
    return this.empresaId;
  }

  override requireEmpresaId(): string {
    return this.empresaId;
  }
}
