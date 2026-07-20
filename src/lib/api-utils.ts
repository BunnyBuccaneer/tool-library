import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  details?: unknown;
};

/**
 * Standard success response.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard error response.
 */
export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Handle errors uniformly in API routes.
 */
export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return apiError("Validation failed", 400, error.flatten());
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return apiError("Authentication required", 401);
    }
    if (error.message === "Forbidden") {
      return apiError("Insufficient permissions", 403);
    }
  }

  return apiError("An unexpected error occurred", 500);
}
