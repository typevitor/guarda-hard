import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity } from './infrastructure/persistence/usuario.orm-entity';
import { TypeOrmUsuarioRepository } from './infrastructure/persistence/usuario.typeorm-repository';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository.interface';
import { CreateUsuarioUseCase } from './application/use-cases/create-usuario.use-case';
import { ListUsuariosUseCase } from './application/use-cases/list-usuarios.use-case';
import { ListUsuariosPaginadoUseCase } from './application/use-cases/list-usuarios-paginado.use-case';
import { GetUsuarioByIdUseCase } from './application/use-cases/get-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from './application/use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from './application/use-cases/delete-usuario.use-case';
import { UsuariosService } from './application/services/usuarios.service';
import { UsuariosController } from './presentation/http/usuarios.controller';
import { TenantModule } from '../../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity]),
    TenantModule,
    AuthModule,
  ],
  controllers: [UsuariosController],
  providers: [
    {
      provide: USUARIO_REPOSITORY,
      useClass: TypeOrmUsuarioRepository,
    },
    CreateUsuarioUseCase,
    ListUsuariosUseCase,
    ListUsuariosPaginadoUseCase,
    GetUsuarioByIdUseCase,
    UpdateUsuarioUseCase,
    DeleteUsuarioUseCase,
    UsuariosService,
  ],
  exports: [USUARIO_REPOSITORY, UsuariosService],
})
export class UsuariosModule {}
