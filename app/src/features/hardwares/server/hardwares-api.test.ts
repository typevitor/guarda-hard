import { ApiError } from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHardwareServer } from './hardwares-api';

vi.mock('@/lib/api/client', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '@/lib/api/client';

describe('createHardwareServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends full create payload contract to API', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(undefined);

    await createHardwareServer({
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-001',
    });

    expect(apiClient).toHaveBeenCalledWith({
      path: '/hardwares',
      method: 'POST',
      body: {
        descricao: 'Notebook',
        marca: 'Dell',
        modelo: 'Latitude',
        codigoPatrimonio: 'PAT-001',
      },
      responseType: 'void',
      fallbackErrorMessage: 'Nao foi possivel criar hardware',
    });
  });

  it('rejects payload missing marca before API call', async () => {
    await expect(
      createHardwareServer({
        descricao: 'Notebook',
        modelo: 'Latitude',
        codigoPatrimonio: 'PAT-001',
      } as never),
    ).rejects.toThrow();

    expect(apiClient).not.toHaveBeenCalled();
  });

  it('propagates normalized API errors', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(new ApiError('Payload invalido', 400));

    await expect(
      createHardwareServer({
        descricao: 'Notebook',
        marca: 'Dell',
        modelo: 'Latitude',
        codigoPatrimonio: 'PAT-001',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Payload invalido',
      status: 400,
    });
  });
});
