const ALL_PROGRAM_ID = 'all'

/** BE `programId`는 int64. `'all'`·비숫자 mock id는 수신자 조회·발송에 쓸 수 없다. */
export function parseNotificationSendProgramId(
  raw: string | undefined | null
): number | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed.toLowerCase() === ALL_PROGRAM_ID) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}
