import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats HttpException as error envelope with code and requestId', () => {
    filter.catch(new NotFoundException('User not found'), mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = (mockResponse.json.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(body).toHaveProperty('error');
    const errorObj = body.error as Record<string, unknown>;
    expect(errorObj).toHaveProperty('code');
    expect(errorObj).toHaveProperty('message', 'User not found');
    expect(errorObj).toHaveProperty('requestId');
    expect(typeof errorObj.requestId).toBe('string');
  });

  it('returns 500 for non-HttpException errors', () => {
    filter.catch(new Error('Something broke'), mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = (mockResponse.json.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    const errorObj = body.error as Record<string, unknown>;
    expect(errorObj.message).toBe('Internal server error');
  });
});
