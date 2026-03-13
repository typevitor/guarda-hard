import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import { Hardware } from '../../domain/entities/hardware.entity';
import type {
  CreateHardwareDto,
  HardwareListQueryDto,
  MarcarDefeitoDto,
  UpdateHardwareDto,
} from '../dto/hardware.schemas';
import { CreateHardwareUseCase } from '../use-cases/create-hardware.use-case';
import { ListHardwaresUseCase } from '../use-cases/list-hardwares.use-case';
import { GetHardwareByIdUseCase } from '../use-cases/get-hardware-by-id.use-case';
import { UpdateHardwareUseCase } from '../use-cases/update-hardware.use-case';
import { DeleteHardwareUseCase } from '../use-cases/delete-hardware.use-case';
import { MarcarDefeitoUseCase } from '../use-cases/marcar-defeito.use-case';
import { ConsertarHardwareUseCase } from '../use-cases/consertar-hardware.use-case';
import { ListHardwaresPaginadoUseCase } from '../use-cases/list-hardwares-paginado.use-case';
import { PaginatedHardwares } from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class HardwaresService {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(CreateHardwareUseCase)
    private readonly createHardwareUseCase: CreateHardwareUseCase,
    @Inject(ListHardwaresUseCase)
    private readonly listHardwaresUseCase: ListHardwaresUseCase,
    @Inject(ListHardwaresPaginadoUseCase)
    private readonly listHardwaresPaginadoUseCase: ListHardwaresPaginadoUseCase,
    @Inject(GetHardwareByIdUseCase)
    private readonly getHardwareByIdUseCase: GetHardwareByIdUseCase,
    @Inject(UpdateHardwareUseCase)
    private readonly updateHardwareUseCase: UpdateHardwareUseCase,
    @Inject(DeleteHardwareUseCase)
    private readonly deleteHardwareUseCase: DeleteHardwareUseCase,
    @Inject(MarcarDefeitoUseCase)
    private readonly marcarDefeitoUseCase: MarcarDefeitoUseCase,
    @Inject(ConsertarHardwareUseCase)
    private readonly consertarHardwareUseCase: ConsertarHardwareUseCase,
  ) {}

  async create(input: CreateHardwareDto): Promise<Hardware> {
    const empresaId = this.tenantContext.requireEmpresaId();

    return this.createHardwareUseCase.execute({
      empresaId,
      descricao: input.descricao,
      marca: input.marca,
      modelo: input.modelo,
      codigoPatrimonio: input.codigoPatrimonio,
    });
  }

  async list(): Promise<Hardware[]> {
    return this.listHardwaresUseCase.execute();
  }

  async listPaginated(
    query: HardwareListQueryDto,
  ): Promise<PaginatedHardwares> {
    return this.listHardwaresPaginadoUseCase.execute(query);
  }

  async getById(id: string): Promise<Hardware> {
    return this.getHardwareByIdUseCase.execute(id);
  }

  async update(id: string, input: UpdateHardwareDto): Promise<Hardware> {
    return this.updateHardwareUseCase.execute({
      id,
      descricao: input.descricao,
      marca: input.marca,
      modelo: input.modelo,
      codigoPatrimonio: input.codigoPatrimonio,
    });
  }

  async delete(id: string): Promise<void> {
    await this.deleteHardwareUseCase.execute(id);
  }

  async marcarDefeito(id: string, input: MarcarDefeitoDto): Promise<Hardware> {
    return this.marcarDefeitoUseCase.execute({
      id,
      descricaoProblema: input.descricaoProblema,
    });
  }

  async consertar(id: string): Promise<Hardware> {
    return this.consertarHardwareUseCase.execute({ id });
  }
}
