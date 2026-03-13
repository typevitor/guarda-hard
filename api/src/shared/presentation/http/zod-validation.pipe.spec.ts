import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  it('throws BadRequestException when payload is invalid', () => {
    const schema = z.object({
      nome: z.string().min(1),
    });
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });

  it('returns parsed payload when valid', () => {
    const schema = z.object({
      nome: z.string().min(1),
    });
    const pipe = new ZodValidationPipe(schema);

    const result = pipe.transform({ nome: 'Suporte' });

    expect(result).toEqual({ nome: 'Suporte' });
  });
});
