import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/domain-error.base';
import {
  CrossTenantAccessError,
  InvalidTenantPayloadError,
  MissingTenantContextError,
} from '../../../tenant/infrastructure/tenant.errors';

type ApiErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  details: unknown[];
};

type HttpExceptionPayload =
  | string
  | {
      message?: string | string[];
      error?: string;
      issues?: unknown[];
      details?: unknown[];
    };

const mapHttpStatusToErrorCode = (statusCode: HttpStatus): string => {
  switch (statusCode) {
    case HttpStatus.CONFLICT:
      return 'BUSINESS_RULE_VIOLATION';
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'AUTH_REQUIRED';
    case HttpStatus.FORBIDDEN:
      return 'TENANT_FORBIDDEN';
    default:
      return 'INTERNAL_ERROR';
  }
};

const getHttpExceptionMessage = (
  payload: HttpExceptionPayload,
  fallback: string,
): string => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }

  return payload.message ?? payload.error ?? fallback;
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = this.mapException(exception);

    response.status(mapped.statusCode).json(mapped);
  }

  private mapException(exception: unknown): ApiErrorResponse {
    if (
      exception instanceof MissingTenantContextError ||
      exception instanceof InvalidTenantPayloadError
    ) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        message: 'Authentication context is required',
        details: [],
      };
    }

    if (exception instanceof UnauthorizedException) {
      const payload = exception.getResponse() as HttpExceptionPayload;

      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        message: getHttpExceptionMessage(payload, 'Authentication required'),
        details: [],
      };
    }

    if (exception instanceof CrossTenantAccessError) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        code: 'TENANT_FORBIDDEN',
        message: 'Cross-tenant access is forbidden',
        details: [],
      };
    }

    if (exception instanceof BadRequestException) {
      const payload = exception.getResponse() as
        | string
        | {
            message?: string | string[];
            issues?: unknown[];
            details?: unknown[];
          };
      const message =
        typeof payload === 'string'
          ? payload
          : Array.isArray(payload.message)
            ? payload.message.join(', ')
            : (payload.message ?? 'Validation failed');
      const details =
        typeof payload === 'string'
          ? []
          : (payload.details ?? payload.issues ?? []);

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message,
        details,
      };
    }

    if (exception instanceof DomainError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'BUSINESS_RULE_VIOLATION',
        message: exception.message,
        details: [],
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus() as HttpStatus;
      const payload = exception.getResponse() as HttpExceptionPayload;
      const message = getHttpExceptionMessage(payload, 'Request failed');

      return {
        statusCode,
        code: mapHttpStatusToErrorCode(statusCode),
        message,
        details: [],
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    };
  }
}
