import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'cardNumber',
  'tokenHash',
]);

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${Date.now() - start}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.error(
            `${method} ${url} ERROR ${Date.now() - start}ms — ${error.message}`,
          );
        },
      }),
    );
  }
}

export function stripSensitiveFields(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !SENSITIVE_FIELDS.has(key)),
  );
}
