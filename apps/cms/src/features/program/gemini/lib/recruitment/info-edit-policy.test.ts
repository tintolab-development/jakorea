import { describe, expect, it } from 'vitest'
import {
  canGeminiRecruitmentInfoEdit,
  getGeminiRecruitmentInfoEditBlockedAlertMessage,
  getGeminiRecruitmentInfoEditBlockedAlertTitle,
} from './info-edit-policy'

describe('canGeminiRecruitmentInfoEdit', () => {
  // 일반 프로그램 isRecruitmentStartLocked 와 동일 — 시작 시각이 속한 분부터 모집 창 잠금.
  const startAt = '2026-09-30T15:00:00.000Z'

  it('모집 시작 시각 전에는 연다', () => {
    expect(canGeminiRecruitmentInfoEdit(startAt, new Date('2026-09-30T14:59:00.000Z'))).toBe(
      true
    )
  })

  it('모집 시작 시각부터 닫는다', () => {
    expect(canGeminiRecruitmentInfoEdit(startAt, new Date('2026-09-30T15:00:00.000Z'))).toBe(
      false
    )
    expect(canGeminiRecruitmentInfoEdit(startAt, new Date('2026-10-28T00:00:00.000Z'))).toBe(
      false
    )
  })

  it('시작일이 없으면 막지 않는다', () => {
    expect(canGeminiRecruitmentInfoEdit('', new Date('2026-10-28T00:00:00.000Z'))).toBe(true)
    expect(canGeminiRecruitmentInfoEdit(null, new Date('2026-10-28T00:00:00.000Z'))).toBe(true)
  })
})

describe('getGeminiRecruitmentInfoEditBlockedAlertMessage', () => {
  it('일반 프로그램 모집 잠금과 같은 안내를 쓴다', () => {
    expect(getGeminiRecruitmentInfoEditBlockedAlertTitle()).toBe('모집 정보 수정 불가 안내')
    expect(getGeminiRecruitmentInfoEditBlockedAlertMessage()).toBe(
      '모집 시작 이후에는 모집 정보를 수정할 수 없습니다.'
    )
  })
})
