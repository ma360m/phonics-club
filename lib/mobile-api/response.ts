import { NextResponse } from 'next/server'

export interface MobileApiErrorBody {
  code: string
  message: string
  requestId?: string
}

export class MobileApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message)
    this.name = 'MobileApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function createMobileRequestId(request?: Request) {
  return (
    request?.headers.get('x-request-id')?.trim() ||
    request?.headers.get('x-correlation-id')?.trim() ||
    crypto.randomUUID()
  )
}

export function createMobileApiResponse<T>(
  data: T,
  options: { status?: number; headers?: HeadersInit } = {},
) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status: options.status ?? 200,
      headers: options.headers,
    },
  )
}

export function createMobileApiError(
  code: string,
  message: string,
  status = 400,
  options: { requestId?: string; headers?: HeadersInit } = {},
) {
  const body: { success: false; error: MobileApiErrorBody } = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (options.requestId) body.error.requestId = options.requestId

  return NextResponse.json(body, {
    status,
    headers: options.headers,
  })
}

export function handleMobileApiError(error: unknown, requestId?: string) {
  if (error instanceof MobileApiError) {
    return createMobileApiError(error.code, error.message, error.status, { requestId })
  }

  console.error('[Mobile API] Unexpected error:', error)
  return createMobileApiError(
    'INTERNAL_ERROR',
    'Something went wrong. Please try again.',
    500,
    { requestId },
  )
}
