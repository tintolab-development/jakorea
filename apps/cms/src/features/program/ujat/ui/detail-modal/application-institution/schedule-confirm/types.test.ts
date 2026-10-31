import { describe, expect, it } from 'vitest'
import { shouldShowScheduleConfirmGuidanceNotes } from './types'

describe('shouldShowScheduleConfirmGuidanceNotes', () => {
  it('기관 확인 완료·승인 완료에서 안내 사항을 노출한다', () => {
    expect(shouldShowScheduleConfirmGuidanceNotes('institution_confirmed')).toBe(true)
    expect(shouldShowScheduleConfirmGuidanceNotes('approval_completed')).toBe(true)
  })

  it('확인 중·수정 요청·신청 반려·null에서는 숨긴다', () => {
    expect(shouldShowScheduleConfirmGuidanceNotes('institution_checking')).toBe(false)
    expect(shouldShowScheduleConfirmGuidanceNotes('revision_requested')).toBe(false)
    expect(shouldShowScheduleConfirmGuidanceNotes('application_rejected')).toBe(false)
    expect(shouldShowScheduleConfirmGuidanceNotes(null)).toBe(false)
  })
})
