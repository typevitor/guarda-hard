export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ErrorPayload = {
  message?: string | string[];
};

function pickMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { message } = payload as ErrorPayload;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const firstString = message.find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );

    if (firstString) {
      return firstString;
    }
  }

  return null;
}

export async function toApiError(response: Response, fallbackMessage: string): Promise<ApiError> {
  try {
    const payload = (await response.json()) as unknown;
    console.log('API Error Payload:', payload);
    const message = pickMessage(payload) ?? fallbackMessage;
    return new ApiError(message, response.status);
  } catch {
    return new ApiError(fallbackMessage, response.status);
  }
}
