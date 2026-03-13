import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HardwaresService } from '../../application/services/hardwares.service';
import {
  createHardwareSchema,
  hardwareIdParamSchema,
  marcarDefeitoSchema,
  type CreateHardwareDto,
  type MarcarDefeitoDto,
  type UpdateHardwareDto,
  updateHardwareSchema,
} from '../../application/dto/hardware.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Hardware } from '../../domain/entities/hardware.entity';

type HardwareHttpResponse = {
  id: string;
  empresaId: string;
  descricao: string;
  marca: string;
  modelo: string;
  codigoPatrimonio: string;
  funcionando: boolean;
  descricaoProblema: string | null;
  livre: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

@Controller('hardwares')
export class HardwaresController {
  constructor(
    @Inject(HardwaresService)
    private readonly hardwaresService: HardwaresService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createHardwareSchema))
    body: CreateHardwareDto,
  ): Promise<HardwareHttpResponse> {
    const created = await this.hardwaresService.create(body);
    return this.toResponse(created);
  }

  @Get()
  async list(): Promise<HardwareHttpResponse[]> {
    const rows = await this.hardwaresService.list();
    return rows.map((row) => this.toResponse(row));
  }

  @Get(':id')
  async getById(
    @Param(new ZodValidationPipe(hardwareIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<HardwareHttpResponse> {
    const found = await this.hardwaresService.getById(params.id);
    return this.toResponse(found);
  }

  @Patch(':id')
  async update(
    @Param(new ZodValidationPipe(hardwareIdParamSchema))
    params: { id: string },
    @Body(new ZodValidationPipe(updateHardwareSchema))
    body: UpdateHardwareDto,
  ): Promise<HardwareHttpResponse> {
    const updated = await this.hardwaresService.update(params.id, body);
    return this.toResponse(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param(new ZodValidationPipe(hardwareIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<void> {
    await this.hardwaresService.delete(params.id);
  }

  @Post(':id/defeito')
  async marcarDefeito(
    @Param(new ZodValidationPipe(hardwareIdParamSchema))
    params: { id: string },
    @Body(new ZodValidationPipe(marcarDefeitoSchema))
    body: MarcarDefeitoDto,
  ): Promise<HardwareHttpResponse> {
    const updated = await this.hardwaresService.marcarDefeito(params.id, body);
    return this.toResponse(updated);
  }

  @Post(':id/conserto')
  async consertar(
    @Param(new ZodValidationPipe(hardwareIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<HardwareHttpResponse> {
    const updated = await this.hardwaresService.consertar(params.id);
    return this.toResponse(updated);
  }

  private toResponse(entity: Hardware): HardwareHttpResponse {
    return {
      id: entity.id,
      empresaId: entity.empresaId,
      descricao: entity.descricao,
      marca: entity.marca,
      modelo: entity.modelo,
      codigoPatrimonio: entity.codigoPatrimonio,
      funcionando: entity.funcionando,
      descricaoProblema: entity.descricaoProblema,
      livre: entity.livre,
      version: entity.version,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
