import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import type {
  CreateDepartamentoDto,
  DepartamentoListQueryDto,
  UpdateDepartamentoDto,
} from '../dto/departamento.schemas';
import { CreateDepartamentoUseCase } from '../use-cases/create-departamento.use-case';
import { ListDepartamentosUseCase } from '../use-cases/list-departamentos.use-case';
import { ListDepartamentosPaginadoUseCase } from '../use-cases/list-departamentos-paginado.use-case';
import { GetDepartamentoByIdUseCase } from '../use-cases/get-departamento-by-id.use-case';
import { UpdateDepartamentoUseCase } from '../use-cases/update-departamento.use-case';
import { DeleteDepartamentoUseCase } from '../use-cases/delete-departamento.use-case';
import { Departamento } from '../../domain/entities/departamento.entity';
import { PaginatedDepartamentos } from '../../domain/repositories/departamento.repository.interface';

@Injectable()
export class DepartamentosService {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(CreateDepartamentoUseCase)
    private readonly createDepartamentoUseCase: CreateDepartamentoUseCase,
    @Inject(ListDepartamentosUseCase)
    private readonly listDepartamentosUseCase: ListDepartamentosUseCase,
    @Inject(ListDepartamentosPaginadoUseCase)
    private readonly listDepartamentosPaginadoUseCase: ListDepartamentosPaginadoUseCase,
    @Inject(GetDepartamentoByIdUseCase)
    private readonly getDepartamentoByIdUseCase: GetDepartamentoByIdUseCase,
    @Inject(UpdateDepartamentoUseCase)
    private readonly updateDepartamentoUseCase: UpdateDepartamentoUseCase,
    @Inject(DeleteDepartamentoUseCase)
    private readonly deleteDepartamentoUseCase: DeleteDepartamentoUseCase,
  ) {}

  async create(input: CreateDepartamentoDto): Promise<Departamento> {
    const empresaId = this.tenantContext.requireEmpresaId();

    return this.createDepartamentoUseCase.execute({
      empresaId,
      nome: input.nome,
    });
  }

  async list(): Promise<Departamento[]> {
    return this.listDepartamentosUseCase.execute();
  }

  async listPaginated(
    query: DepartamentoListQueryDto,
  ): Promise<PaginatedDepartamentos> {
    return this.listDepartamentosPaginadoUseCase.execute(query);
  }

  async getById(id: string): Promise<Departamento> {
    return this.getDepartamentoByIdUseCase.execute(id);
  }

  async update(
    id: string,
    input: UpdateDepartamentoDto,
  ): Promise<Departamento> {
    return this.updateDepartamentoUseCase.execute({
      id,
      nome: input.nome,
    });
  }

  async delete(id: string): Promise<void> {
    await this.deleteDepartamentoUseCase.execute(id);
  }
}
