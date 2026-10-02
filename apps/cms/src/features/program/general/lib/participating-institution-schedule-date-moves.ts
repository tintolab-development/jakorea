import dayjs from 'dayjs'

export type ParticipantScheduleDateMove = {
  fromDate: string
  toDate: string
}

export function parseParticipatingSessionCalendarDate(dateLabel: string): string | null {
  const parsed = dayjs(dateLabel.replace(/\s/g, '').replace(/\./g, '-'))
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}

/** 화면에서 고른 회차를 `PATCH …/schedules`의 fromDate/toDate 쌍으로 묶는다. */
export function buildParticipantScheduleDateMoves(
  changes: ReadonlyArray<{ session: { date: string }; changedDate: string }>
): { ok: true; moves: ParticipantScheduleDateMove[] } | { ok: false; message: string } {
  const byFromDate = new Map<string, string>()
  for (const change of changes) {
    const fromDate = parseParticipatingSessionCalendarDate(change.session.date)
    if (!fromDate) {
      return { ok: false, message: '기준 일정 날짜를 읽지 못해 변경할 수 없습니다.' }
    }
    if (fromDate === change.changedDate) continue
    const existing = byFromDate.get(fromDate)
    if (existing && existing !== change.changedDate) {
      return {
        ok: false,
        message: '같은 날짜에 시작하는 일정은 하나의 날짜로만 옮길 수 있습니다.',
      }
    }
    byFromDate.set(fromDate, change.changedDate)
  }
  const moves = [...byFromDate.entries()].map(([fromDate, toDate]) => ({ fromDate, toDate }))
  if (moves.length === 0) {
    return { ok: false, message: '변경된 날짜가 없습니다.' }
  }
  return { ok: true, moves }
}
