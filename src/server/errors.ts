/**
 * Domain errors. Services throw these; the API layer converts them into
 * `{ message, errors }` JSON with a proper status code. Messages are written
 * for end users (Bahasa Indonesia) and never contain internal details.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "BAD_REQUEST",
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Silakan masuk terlebih dahulu.") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Kamu tidak memiliki akses untuk tindakan ini.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>, message = "Periksa kembali data yang kamu isi.") {
    super(message, 422, "VALIDATION_ERROR", errors);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.") {
    super(message, 429, "RATE_LIMITED");
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
