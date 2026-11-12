import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { createFinalAnnounceDisabledDate } from './recruit-final-announce-date'

describe('createFinalAnnounceDisabledDate (QA-0124)', () => {
  it('모집 기간이 없으면 제한하지 않는다', () => {
    expect(createFinalAnnounceDisabledDate(null)).toBeUndefined()
  })

  it('모집 종료일 이전은 막고, 종료일 당일·이후는 허용한다', () => {
    const disabled = createFinalAnnounceDisabledDate([dayjs('2026-12-01'), dayjs('2026-12-20T14:59:59')])!
    expect(disabled(dayjs('2026-12-19'))).toBe(true)
    expect(disabled(dayjs('2026-12-01'))).toBe(true)
    expect(disabled(dayjs('2026-12-20'))).toBe(false)
    expect(disabled(dayjs('2026-12-21'))).toBe(false)
  })
})
