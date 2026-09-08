import { describe, expect, it } from 'vitest'
import {
  collectTemplatePlaceholderKeys,
  findMissingAlimtalkTemplateVariableKeys,
  formatAlimtalkFailedReason,
  formatAlimtalkMissingVariablesMessage,
} from './alimtalk-send-batch-adapters'

describe('alimtalk-send-batch-adapters placeholders', () => {
  it('본문·titleTemplate에서 #{...} 추출 (휴면 템플릿)', () => {
    const keys = collectTemplatePlaceholderKeys({
      content: '아이디: #{사용자 아이디(이메일)}\n일시: #{휴면 전환일시}',
      titleTemplate: '',
    })
    expect([...keys].sort()).toEqual(['사용자 아이디(이메일)', '휴면 전환일시'].sort())
  })

  it('회원가입처럼 placeholder 없으면 빈 집합', () => {
    expect(
      collectTemplatePlaceholderKeys({
        content: '회원가입이 완료되었습니다.',
      }).size
    ).toBe(0)
  })

  it('DIRECT + phone만이면 필수 변수 누락', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['사용자 아이디(이메일)', '휴면 전환일시'],
      recipients: [{ actorType: 'DIRECT', source: 'manual' }],
    })
    expect(missing).toEqual(['사용자 아이디(이메일)', '휴면 전환일시'])
    expect(formatAlimtalkMissingVariablesMessage(missing)).toBe(
      '템플릿 필수 변수가 없습니다: 사용자 아이디(이메일), 휴면 전환일시'
    )
  })

  it('MEMBER+actorId는 이메일을 enrich 충족으로 보고 휴면일시만 누락', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['사용자 아이디(이메일)', '휴면 전환일시'],
      recipients: [{ actorType: 'MEMBER', actorId: 12 }],
    })
    expect(missing).toEqual(['휴면 전환일시'])
  })

  it('batch variables에 모두 채우면 누락 없음', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['사용자 아이디(이메일)', '휴면 전환일시'],
      batchVariables: {
        '사용자 아이디(이메일)': 'user@example.com',
        '휴면 전환일시': '2026-09-08 12:00',
      },
      recipients: [{ actorType: 'DIRECT', source: 'manual' }],
    })
    expect(missing).toEqual([])
  })

  it('failedReason 코드를 사용자 문구로 변환', () => {
    expect(
      formatAlimtalkFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:사용자 아이디(이메일)'
      )
    ).toBe('템플릿 필수 변수가 없습니다: 사용자 아이디(이메일)')
  })
})
