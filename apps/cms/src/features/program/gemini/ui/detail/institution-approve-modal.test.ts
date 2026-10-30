import { describe, expect, it } from 'vitest'
import { buildGeminiInstitutionApproveMessage } from './institution-approve-modal'

describe('buildGeminiInstitutionApproveMessage', () => {
  it('matches Figma single-member copy without schedule assignment', () => {
    expect(buildGeminiInstitutionApproveMessage('김제이', 1, false)).toBe(
      '**[김제이]** 님의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.'
    )
  })

  it('uses bulk copy without schedule assignment', () => {
    expect(buildGeminiInstitutionApproveMessage('김제이', 3)).toBe(
      '**[김제이] 님 외 2명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.'
    )
  })
})
