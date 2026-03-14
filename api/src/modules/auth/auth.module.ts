import { Module } from '@nestjs/common';
import { AuthController } from './presentation/http/auth.controller';
import { AuthService } from './application/services/auth.service';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { ListMinhasEmpresasUseCase } from './application/use-cases/list-minhas-empresas.use-case';
import { SelectEmpresaUseCase } from './application/use-cases/select-empresa.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { PasswordHasher } from './infrastructure/security/password-hasher';
import { SessionTokenService } from './infrastructure/security/session-token.service';
import { SessionPhaseGuard } from './presentation/http/session-phase.guard';
import { AuthGuard } from './presentation/http/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterUseCase,
    LoginUseCase,
    ListMinhasEmpresasUseCase,
    SelectEmpresaUseCase,
    GetCurrentUserUseCase,
    PasswordHasher,
    SessionTokenService,
    AuthGuard,
    SessionPhaseGuard,
  ],
  exports: [SessionTokenService, AuthGuard, SessionPhaseGuard],
})
export class AuthModule {}
