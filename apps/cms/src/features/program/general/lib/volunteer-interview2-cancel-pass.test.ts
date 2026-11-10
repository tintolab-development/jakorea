import { describe, expect, it } from 'vitest'
import {
  buildVolunteerInterview2CancelPassMessage,
  isGeneralVolunteerInterview2ResultPassed,
  resolveVolunteerInterview2CancelPassNotifyVariant,
  resolveVolunteerInterview2CancelPassReasonLabel,
  resolveVolunteerInterview2CancelPassButtonLabel,
} from '@/features/program/general/lib/volunteer-interview2-cancel-pass'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

const baseRow = {
  id: 'v1',
  name: '김제이',
  secondInterviewScreeningStatus: 'pass',
} as GeneralVolunteerApplicantRow

describe('volunteer-interview2-cancel-pass', () => {
  it('합격·예비합격을 합격 취소 대상으로 본다', () => {
    expect(isGeneralVolunteerInterview2ResultPassed('pass')).toBe(true)
    expect(isGeneralVolunteerInterview2ResultPassed('reserve2')).toBe(true)
    expect(isGeneralVolunteerInterview2ResultPassed('fail')).toBe(false)
    expect(isGeneralVolunteerInterview2ResultPassed('waiting')).toBe(false)
  })

  it('즉시 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveVolunteerInterview2CancelPassNotifyVariant({
        ...baseRow,
        finalResultNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('예약 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveVolunteerInterview2CancelPassNotifyVariant({
        ...baseRow,
        finalResultNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('시안형 pending 메시지를 만든다', () => {
    expect(buildVolunteerInterview2CancelPassMessage('김제이', 'pendingNotification')).toContain(
      '면접 합격 처리를 취소하시겠습니까?'
    )
    expect(buildVolunteerInterview2CancelPassMessage('김제이', 'pendingNotification')).toContain(
      '반려 사유로 안내'
    )
  })

  it('예비 합격 상태는 예비 합격 취소 버튼 라벨을 쓴다', () => {
    expect(resolveVolunteerInterview2CancelPassButtonLabel('pass')).toBe('합격 취소')
    expect(resolveVolunteerInterview2CancelPassButtonLabel('reserve2')).toBe('예비 합격 취소')
    expect(resolveVolunteerInterview2CancelPassButtonLabel('fail')).toBe('합격 취소')
  })

  it('시안형 alreadySent 메시지에 반려 처리를 포함한다', () => {
    expect(buildVolunteerInterview2CancelPassMessage('김제이', 'alreadySent')).toContain(
      '**반려 처리**'
    )
    expect(resolveVolunteerInterview2CancelPassReasonLabel('pendingNotification')).toBe('취소 사유')
    expect(resolveVolunteerInterview2CancelPassReasonLabel('alreadySent')).toBe('취소 사유')
  })
})
