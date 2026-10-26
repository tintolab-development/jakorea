function seoulDateKey(iso: string): string | null {
  const stamp = new Date(iso)
  if (Number.isNaN(stamp.getTime())) return null
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(stamp)
  return /^\d{4}-\d{2}-\d{2}$/.test(formatted) ? formatted : null
}

/** 활동 포기자는 포기일 이후 일정 테이블에서 숨긴다. 포기 당일·이전 일정은 남긴다. */
export function shouldHideGiveUpParticipantFromSchedule(input: {
  giveUpAt?: string | null
  participantStatus?: string | null
  scheduleStartAt?: string | null
}): boolean {
  const status = (input.participantStatus ?? '').trim().toUpperCase()
  const giveUpAt = input.giveUpAt?.trim() || null
  const isGiveUp = giveUpAt != null || status === 'GIVE_UP'
  if (!isGiveUp) return false
  if (giveUpAt == null) return true
  if (!input.scheduleStartAt?.trim()) return false
  const giveUpDay = seoulDateKey(giveUpAt)
  const scheduleDay = seoulDateKey(input.scheduleStartAt)
  if (giveUpDay == null || scheduleDay == null) return false
  return scheduleDay > giveUpDay
}
