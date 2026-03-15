import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    TenantModule,
    HardwaresModule,
    EmprestimosModule,
    DepartamentosModule,
    UsuariosModule,
    RelatoriosModule,
    EmpresasModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
