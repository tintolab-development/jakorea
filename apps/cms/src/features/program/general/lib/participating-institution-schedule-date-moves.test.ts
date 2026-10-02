import { describe, expect, it } from 'vitest'
import { buildParticipantScheduleDateMoves } from './participating-institution-schedule-date-moves'

describe('buildParticipantScheduleDateMoves', () => {
  it('같은 시작일을 하나의 fromDate/toDate로 묶는다', () => {
    expect(
      buildParticipantScheduleDateMoves([
        { session: { date: '2026.04.20' }, changedDate: '2026-05-01' },
        { session: { date: '2026.04.20' }, changedDate: '2026-05-01' },
        { session: { date: '2026.04.27' }, changedDate: '2026-05-08' },
      ])
    ).toEqual({
      ok: true,
      moves: [
        { fromDate: '2026-04-20', toDate: '2026-05-01' },
        { fromDate: '2026-04-27', toDate: '2026-05-08' },
      ],
    })
  })

  it('같은 시작일을 서로 다른 날짜로 옮기면 거절한다', () => {
    const result = buildParticipantScheduleDateMoves([
      { session: { date: '2026.04.20' }, changedDate: '2026-05-01' },
      { session: { date: '2026.04.20' }, changedDate: '2026-05-02' },
    ])
    expect(result.ok).toBe(false)
  })
})
