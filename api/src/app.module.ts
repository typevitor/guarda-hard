import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TenantModule } from './tenant';
import { HardwaresModule } from './modules/hardwares/hardwares.module';
import { EmprestimosModule } from './modules/emprestimos/emprestimos.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    HardwaresModule,
    EmprestimosModule,
    DepartamentosModule,
    UsuariosModule,
    RelatoriosModule,
    EmpresasModule,
    AuthModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
