export function getCompanySchoolHttpStatus(error: unknown): number | undefined {
  if (error == null || typeof error !== 'object' || !('response' in error)) {
    return undefined
  }
  const response = (error as { response?: unknown }).response
  if (response == null || typeof response !== 'object' || !('status' in response)) {
    return undefined
  }
  const status = (response as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

export function shouldRetryCompanySchoolQuery(
  failureCount: number,
  error: unknown
): boolean {
  const status = getCompanySchoolHttpStatus(error)
  if (status != null && status >= 400 && status < 500) return false
  return failureCount < 2
}
