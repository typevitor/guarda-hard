import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentAuthUser = {
  userId: string;
  empresaId?: string;
};

export const CurrentAuthUserDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentAuthUser => {
    const request = ctx.switchToHttp().getRequest<{ authUser?: CurrentAuthUser }>();
    return request.authUser ?? { userId: '' };
  },
);

export const CurrentAuthUser = CurrentAuthUserDecorator;
