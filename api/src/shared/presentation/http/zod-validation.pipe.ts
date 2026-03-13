import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe<
  TInput = unknown,
  TOutput = TInput,
> implements PipeTransform<TInput, TOutput> {
  constructor(private readonly schema: ZodSchema<TOutput>) {}

  transform(value: TInput): TOutput {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      });
    }

    return parsed.data;
  }
}
