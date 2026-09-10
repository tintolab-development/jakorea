import { describe, expect, it } from 'vitest'
import {
  listNotificationMailContextKeysInTexts,
  NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT,
  pickNotificationMailContextVariables,
} from './mail-context-variables'
import { formatNotificationFailedReason } from './format-notification-failed-reason'

describe('mail context variables (BE 2026-09-10)', () => {
  it('detects 동의 항목·만료일시 tokens in compose', () => {
    expect(
      listNotificationMailContextKeysInTexts(
        '#{회원명} #{동의 항목} #{만료일시}',
        '제목'
      )
    ).toEqual(['동의 항목', '만료일시'])
  })

  it('omits empty values from create.variables', () => {
    expect(
      pickNotificationMailContextVariables({
        '동의 항목': ' 개인정보 수집·이용 동의 ',
        만료일시: '  ',
      })
    ).toEqual({ '동의 항목': '개인정보 수집·이용 동의' })
    expect(pickNotificationMailContextVariables({ '동의 항목': '', 만료일시: '' })).toBeUndefined()
  })

  it('formats fail-closed reason with context keys preserved', () => {
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:동의 항목,만료일시'
      )
    ).toBe('템플릿 필수 변수가 없습니다: 동의 항목, 만료일시')
    expect(NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT).toContain('회원 프로필 자동값이 아닙니다')
  })
})
