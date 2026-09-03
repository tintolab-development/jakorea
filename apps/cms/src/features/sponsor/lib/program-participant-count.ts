/**
 * 프로그램 진행 이력 `participantCount`("실제 / 정원")에서 실제 참여자 수를 읽는다.
 * 누적 수혜자 = 해당 후원사 모든 프로그램 참여자 합.
 */
export function parseProgramParticipantCount(raw: string | undefined | null): number {
  const text = raw?.trim() ?? ''
  if (!text) return 0
  const firstToken = text.split('/')[0]?.trim() ?? ''
  const digits = firstToken.replace(/[^\d]/g, '')
  if (!digits) return 0
  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function sumProgramParticipantCount(
  rows: ReadonlyArray<{ participantCount?: string; year?: number }>,
  year?: number
): number {
  return rows.reduce((sum, row) => {
    if (year != null && row.year !== year) return sum
    return sum + parseProgramParticipantCount(row.participantCount)
  }, 0)
}
