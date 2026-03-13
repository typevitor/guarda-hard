import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { AppModule } from '../app.module';
import { TenantContext } from './application/tenant-context';

vi.mock('../infrastructure/database/database.module', () => ({
  DatabaseModule: class DatabaseModule {},
}));

vi.mock('../modules/hardwares/hardwares.module', () => ({
  HardwaresModule: class HardwaresModule {},
}));

vi.mock('../modules/emprestimos/emprestimos.module', () => ({
  EmprestimosModule: class EmprestimosModule {},
}));

vi.mock('../modules/departamentos/departamentos.module', () => ({
  DepartamentosModule: class DepartamentosModule {},
}));

vi.mock('../modules/usuarios/usuarios.module', () => ({
  UsuariosModule: class UsuariosModule {},
}));

vi.mock('../modules/relatorios/relatorios.module', () => ({
  RelatoriosModule: class RelatoriosModule {},
}));

describe('TenantModule wiring', () => {
  it('resolves TenantContext from AppModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const tenantContext = moduleRef.get(TenantContext);

    expect(tenantContext).toBeInstanceOf(TenantContext);
  });
});
