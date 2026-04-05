import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): { id: string; role: string } => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as { id: string; role: string };
  },
);
