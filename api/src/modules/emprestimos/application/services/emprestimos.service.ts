import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import type {
  CreateEmprestimoDto,
  EmprestimoListQueryDto,
} from '../dto/emprestimo.schemas';
import { EmprestarHardwareUseCase } from '../use-cases/emprestar-hardware.use-case';
import { DevolverHardwareUseCase } from '../use-cases/devolver-hardware.use-case';
import { ListEmprestimosPaginadoUseCase } from '../use-cases/list-emprestimos-paginado.use-case';
import { PaginatedEmprestimos } from '../../domain/repositories/emprestimo.repository.interface';

@Injectable()
export class EmprestimosService {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(EmprestarHardwareUseCase)
    private readonly emprestarHardwareUseCase: EmprestarHardwareUseCase,
    @Inject(DevolverHardwareUseCase)
    private readonly devolverHardwareUseCase: DevolverHardwareUseCase,
    @Inject(ListEmprestimosPaginadoUseCase)
    private readonly listEmprestimosPaginadoUseCase: ListEmprestimosPaginadoUseCase,
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

  async listPaginated(
    query: EmprestimoListQueryDto,
  ): Promise<PaginatedEmprestimos> {
    return this.listEmprestimosPaginadoUseCase.execute(query);
  }
}
