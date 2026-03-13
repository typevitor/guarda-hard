import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import type { CreateEmprestimoDto } from '../dto/emprestimo.schemas';
import { EmprestarHardwareUseCase } from '../use-cases/emprestar-hardware.use-case';
import { DevolverHardwareUseCase } from '../use-cases/devolver-hardware.use-case';

@Injectable()
export class EmprestimosService {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(EmprestarHardwareUseCase)
    private readonly emprestarHardwareUseCase: EmprestarHardwareUseCase,
    @Inject(DevolverHardwareUseCase)
    private readonly devolverHardwareUseCase: DevolverHardwareUseCase,
  ) {}

  async emprestar(input: CreateEmprestimoDto): Promise<Emprestimo> {
    const empresaId = this.tenantContext.requireEmpresaId();

    return this.emprestarHardwareUseCase.execute({
      empresaId,
      usuarioId: input.usuarioId,
      hardwareId: input.hardwareId,
    });
  }

  async devolver(id: string): Promise<Emprestimo> {
    return this.devolverHardwareUseCase.execute({ id });
  }
}
