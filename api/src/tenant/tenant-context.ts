import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  InvalidTenantPayloadError,
  MissingTenantContextError,
} from './tenant.errors';
import type { JwtTenantPayload } from './tenant.types';

type TenantStore = {
  empresaId: string;
};

@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run<T>(empresaId: string, fn: () => T): T {
    return this.storage.run({ empresaId }, fn);
  }

  runFromJwtPayload<T>(payload: Partial<JwtTenantPayload>, fn: () => T): T {
    if (!payload.empresa_id) {
      throw new InvalidTenantPayloadError();
    }

    return this.run(payload.empresa_id, fn);
  }

  getEmpresaId(): string | null {
    return this.storage.getStore()?.empresaId ?? null;
  }

  requireEmpresaId(): string {
    const empresaId = this.getEmpresaId();

    if (!empresaId) {
      throw new MissingTenantContextError();
    }

    return empresaId;
  }
}
