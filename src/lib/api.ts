import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export function ok<T>(data: T, meta?: ApiMeta, init?: ResponseInit) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, init);
}

export function created<T>(data: T) {
  return ok(data, undefined, { status: 201 });
}

export function fail(message: string, status = 400, code = "BAD_REQUEST", details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export function unauthorized(message = "Authentication required") {
  return fail(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "You do not have access to this resource") {
  return fail(message, 403, "FORBIDDEN");
}

export function notFound(message = "Resource not found") {
  return fail(message, 404, "NOT_FOUND");
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function handle<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.message, error.status, error.code);
    }
    if (error instanceof ZodError) {
      return fail("Validation failed", 422, "VALIDATION_ERROR", error.issues);
    }
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(message, 500, "INTERNAL_ERROR");
  }
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400, "INVALID_JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "),
      422,
      "VALIDATION_ERROR",
    );
  }
  return parsed.data;
}

export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      parsed.error.issues.map((i) => `${i.path.join(".") || "query"}: ${i.message}`).join("; "),
      422,
      "VALIDATION_ERROR",
    );
  }
  return parsed.data;
}

export function paginationMeta(page: number, limit: number, total: number): ApiMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
