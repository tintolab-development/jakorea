import { describe, expect, it } from 'vitest'
import { buildGeminiInstitutionApproveMessage } from './institution-approve-modal'

describe('buildGeminiInstitutionApproveMessage', () => {
  it('matches the institution single-approval copy without schedule assignment', () => {
    expect(buildGeminiInstitutionApproveMessage('JA초등학교', 1, false)).toBe(
      '**[JA초등학교]**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.'
    )
  })

  it('uses bulk copy without schedule assignment', () => {
    expect(buildGeminiInstitutionApproveMessage('JA초등학교', 3)).toBe(
      '**[JA초등학교] 외 2개**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.'
    )
  })
})
