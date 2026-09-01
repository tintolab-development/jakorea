/**
 * Me preferences PUT 409(revision) 시 최신 revision으로 1회 재시도
 */

export async function runWithRevisionConflictRetry<
  TRequest extends { revision?: number },
  TResponse,
>(
  request: TRequest,
  save: (body: TRequest) => Promise<TResponse>,
  reloadRevision: () => Promise<number | undefined>,
  getHttpStatus: (error: unknown) => number | undefined
): Promise<TResponse> {
  try {
    return await save(request)
  } catch (error) {
    if (getHttpStatus(error) !== 409) throw error
    const revision = await reloadRevision()
    return await save({ ...request, revision })
  }
}
