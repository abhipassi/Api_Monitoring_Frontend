import { content } from '@/content/index.js'

// What every failed API call turns into, so screens handle one shape.
export class ApiError extends Error {
  constructor({ message, status = 0, code = null, errors = [], isNetwork = false }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    // Every problem when the API lists several (monitor form); otherwise just the message
    this.errors = errors.length ? errors : [message]
    this.isNetwork = isNetwork
  }

  static from(error) {
    if (error instanceof ApiError) return error
    const response = error?.response
    if (!response) {
      return new ApiError({ message: content.errors.network, isNetwork: true })
    }
    const body = response.data ?? {}
    return new ApiError({
      message: body.message || content.errors.byStatus[response.status] || content.errors.generic,
      status: response.status,
      code: body.code ?? null,
      errors: Array.isArray(body.errors) ? body.errors : [],
    })
  }
}

export const errorMessage = (error) => ApiError.from(error).message
