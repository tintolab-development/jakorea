import axios from 'axios'

export function getAdminHttpStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined
  return error.response?.status
}

export function isAdminAuthExpired(error: unknown): boolean {
  return getAdminHttpStatus(error) === 401
}

export function isAdminForbidden(error: unknown): boolean {
  return getAdminHttpStatus(error) === 403
}

export function isAdminNotFound(error: unknown): boolean {
  return getAdminHttpStatus(error) === 404
}

export function shouldRetrySystemInboxQuery(failureCount: number, error: unknown): boolean {
  const status = getAdminHttpStatus(error)
  if (status != null && [400, 401, 403, 404, 409, 422].includes(status)) return false
  return failureCount < 1
}
