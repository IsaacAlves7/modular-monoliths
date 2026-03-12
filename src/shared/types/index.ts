export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
  meta?: Record<string, unknown>
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

export function failure(message: string, errors?: unknown): ApiResponse {
  return { success: false, message, errors }
}

// JWT Payload
export interface JwtPayload {
  sub: string       // userId
  email: string
  role: string
  iat?: number
  exp?: number
}
