import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  loginSchema,
  registerSchema,
  selectEmpresaSchema,
  type LoginDto,
  type RegisterDto,
  type SelectEmpresaDto,
} from '../../application/dto/auth.schemas';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ListMinhasEmpresasUseCase } from '../../application/use-cases/list-minhas-empresas.use-case';
import { SelectEmpresaUseCase } from '../../application/use-cases/select-empresa.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { AuthService } from '../../application/services/auth.service';
import { SessionTokenService } from '../../infrastructure/security/session-token.service';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { AuthGuard } from './auth.guard';
import { CurrentAuthUserDecorator } from './current-auth-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase)
    private readonly registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(ListMinhasEmpresasUseCase)
    private readonly listMinhasEmpresasUseCase: ListMinhasEmpresasUseCase,
    @Inject(SelectEmpresaUseCase)
    private readonly selectEmpresaUseCase: SelectEmpresaUseCase,
    @Inject(GetCurrentUserUseCase)
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject(SessionTokenService)
    private readonly sessionTokenService: SessionTokenService,
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Get('empresas')
  async listEmpresas(): Promise<{
    items: Array<{ id: string; nome: string }>;
  }> {
    const items = await this.authService.listEmpresas();
    return { items };
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(registerSchema))
    body: RegisterDto,
  ): Promise<{ userId: string }> {
    const result = await this.registerUseCase.execute({
      nome: body.nome,
      email: body.email,
      senha: body.senha,
      empresaId: body.empresaId,
    });

    return result;
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ phase: 'A' }> {
    const session = await this.loginUseCase.execute(body);
    this.setAuthCookie(response, this.sessionTokenService.sign(session));
    return { phase: 'A' };
  }

  @Get('minhas-empresas')
  @UseGuards(AuthGuard)
  async minhasEmpresas(
    @CurrentAuthUserDecorator() user: { userId: string },
  ): Promise<{ items: Array<{ id: string; nome: string }> }> {
    const items = await this.listMinhasEmpresasUseCase.execute(user.userId);
    return { items };
  }

  @Post('select-empresa')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async selectEmpresa(
    @CurrentAuthUserDecorator() user: { userId: string },
    @Body(new ZodValidationPipe(selectEmpresaSchema))
    body: SelectEmpresaDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ phase: 'B'; empresaId: string }> {
    const upgraded = await this.selectEmpresaUseCase.execute({
      userId: user.userId,
      empresaId: body.empresaId,
    });

    this.setAuthCookie(response, this.sessionTokenService.sign(upgraded));

    return {
      phase: 'B',
      empresaId: body.empresaId,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(
    @CurrentAuthUserDecorator() user: { userId: string; empresaId?: string },
  ): {
    id: string;
    empresaId?: string;
  } {
    const current = this.getCurrentUserUseCase.execute(user);

    return {
      id: current.userId,
      empresaId: current.empresaId,
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): { ok: true } {
    this.clearAuthCookie(response);
    return { ok: true };
  }

  private setAuthCookie(response: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookie('gh_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
    });
  }

  private clearAuthCookie(response: Response): void {
    response.cookie('gh_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
}
