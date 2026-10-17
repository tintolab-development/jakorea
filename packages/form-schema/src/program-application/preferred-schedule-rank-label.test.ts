import { describe, expect, it } from 'vitest'
import {
  resolvePreferredScheduleBlockTitle,
  shouldShowPreferredScheduleRankLabel,
} from './preferred-schedule-rank-label.js'

describe('preferred schedule rank label', () => {
  it('1지망만 있으면 랭크 문구를 숨긴다', () => {
    expect(shouldShowPreferredScheduleRankLabel(1, 10)).toBe(false)
    expect(resolvePreferredScheduleBlockTitle(0, 1, 10)).toBe('')
  })

  it('2지망 이상이면 랭크 문구를 노출한다', () => {
    expect(shouldShowPreferredScheduleRankLabel(2, 10)).toBe(true)
    expect(resolvePreferredScheduleBlockTitle(0, 2, 10)).toBe('■ 1지망')
    expect(resolvePreferredScheduleBlockTitle(1, 2, 10)).toBe('■ 2지망')
  })

  it('상한이 1이면 랭크 문구를 숨긴다', () => {
    expect(resolvePreferredScheduleBlockTitle(0, 1, 1)).toBe('')
  })
})
