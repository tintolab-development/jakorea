import { describe, expect, it } from 'vitest'
import {
  buildVolunteerInterview2CancelFailMessage,
  isGeneralVolunteerInterview2ResultFailed,
  resolveVolunteerInterview2CancelFailNotifyVariant,
} from '@/features/program/general/lib/volunteer-interview2-cancel-fail'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

const baseRow = {
  id: 'v1',
  name: '김제이',
  secondInterviewScreeningStatus: 'fail',
} as GeneralVolunteerApplicantRow

describe('volunteer-interview2-cancel-fail', () => {
  it('불합격만 불합격 취소 대상으로 본다', () => {
    expect(isGeneralVolunteerInterview2ResultFailed('fail')).toBe(true)
    expect(isGeneralVolunteerInterview2ResultFailed('pass')).toBe(false)
    expect(isGeneralVolunteerInterview2ResultFailed('waiting')).toBe(false)
  })

  it('즉시 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveVolunteerInterview2CancelFailNotifyVariant({
        ...baseRow,
        finalResultNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('시안형 pending 메시지에 심사 대기 처리를 포함한다', () => {
    const message = buildVolunteerInterview2CancelFailMessage('김제이', 'pendingNotification')
    expect(message).toContain('면접 불합격 처리를 취소하시겠습니까?')
    expect(message).toContain('**심사 대기 처리**')
  })

  it('시안형 alreadySent 메시지에 취소 사유·심사 대기 처리를 포함한다', () => {
    const message = buildVolunteerInterview2CancelFailMessage('김제이', 'alreadySent')
    expect(message).toContain('취소 사유로 안내')
    expect(message).toContain('**심사 대기 처리**')
  })
})
