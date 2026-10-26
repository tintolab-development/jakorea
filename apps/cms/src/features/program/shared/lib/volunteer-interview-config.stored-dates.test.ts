import { describe, expect, it } from 'vitest'
import { applyTypedVolunteerInterviewToOverlay } from './volunteer-interview-config'

describe('봉사 면접 typed 예외일 — 읽을 수 없는 날짜는 throw 하지 않는다', () => {
  it('잘못된 exceptionDate 는 그 키만 지우고, 정상 날짜는 서울 자정 ISO 로 쓴다', () => {
    const run = () =>
      applyTypedVolunteerInterviewToOverlay(
        {},
        {
          schemaVersion: 1,
          selectedSlotKeys: [],
          exceptions: [
            { id: 'a', exceptionDate: 'garbage', selectedSlotKeys: [] },
            { id: 'b', exceptionDate: '2026-12-08', selectedSlotKeys: [] },
            { id: 'c', exceptionDate: '2026-12-08T15:00:00Z', selectedSlotKeys: [] },
          ],
        }
      )
    expect(run).not.toThrow()
    const overlay = run() ?? {}
    expect(overlay['recruit.volunteer.interview.exception.a.exceptionDate']).toBeUndefined()
    expect(overlay['recruit.volunteer.interview.exception.b.exceptionDate']).toBe(
      '2026-12-07T15:00:00.000Z'
    )
    expect(overlay['recruit.volunteer.interview.exception.c.exceptionDate']).toBe(
      '2026-12-08T15:00:00.000Z'
    )
  })
})
