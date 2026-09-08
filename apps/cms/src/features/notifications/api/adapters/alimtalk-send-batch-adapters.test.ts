import { describe, expect, it } from 'vitest'
import {
  buildCreateSendBatchRequest,
  collectTemplatePlaceholderKeys,
  findMissingAlimtalkTemplateVariableKeys,
  formatAlimtalkFailedReason,
  formatAlimtalkMissingVariablesMessage,
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
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

  it('빈 문자열 variables는 생략하고 값이 있는 항목만 남긴다', () => {
    expect(pickNonEmptySendVariables({ 회원명: '', 프로그램명: '  ' })).toBeUndefined()
    expect(pickNonEmptySendVariables({ 회원명: '홍길동', 프로그램명: '' })).toEqual({
      회원명: '홍길동',
    })
  })

  it('발송 요청은 programId 필수이고 variables를 기본 생략한다', () => {
    const request = buildCreateSendBatchRequest({
      batchName: '알림톡 발송',
      templateId: 11,
      programId: 77,
      recipients: [
        {
          id: 'actor-MEMBER-1',
          participationType: 'participant',
          name: '홍길동',
          phone: '010-1111-2222',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 1,
        },
      ],
    })
    expect(request.programId).toBe(77)
    expect(request).not.toHaveProperty('variables')
    expect(request.recipients[0]).toMatchObject({
      actorType: 'MEMBER',
      actorId: 1,
    })
  })

  it('DIRECT 수신자는 actorId 없이 recipientContact만 실는다', () => {
    const request = buildCreateSendBatchRequest({
      batchName: '알림톡 발송',
      templateId: 11,
      programId: 77,
      recipients: [
        {
          id: 'manual-1',
          participationType: '',
          name: '직접',
          phone: '010-3333-4444',
          source: 'manual',
          actorType: 'DIRECT',
        },
      ],
    })
    expect(request.recipients[0]).toEqual({
      actorType: 'DIRECT',
      recipientContact: '01033334444',
      recipientName: '직접',
    })
    expect(request.recipients[0]).not.toHaveProperty('actorId')
  })

  it('enabled를 BE 값 그대로 옮기고 로컬 재계산하지 않는다', () => {
    const mapped = mapTemplateVariablesCatalog({
      categories: [
        {
          categoryCode: 'name',
          categoryLabel: '이름',
          variables: [
            {
              key: '회원명',
              token: '#{회원명}',
              description: '회원 이름',
              requiresProgram: false,
              enabled: true,
              programGroups: [],
              memberTypes: ['GENERAL'],
            },
            {
              key: '프로그램명',
              token: '#{프로그램명}',
              description: '프로그램',
              requiresProgram: true,
              enabled: false,
              programGroups: ['GENERAL'],
            },
          ],
        },
      ],
    })
    expect(mapped).toEqual([
      expect.objectContaining({
        key: '회원명',
        enabled: true,
        requiresProgram: false,
        programGroups: [],
        memberTypes: ['GENERAL'],
      }),
      expect.objectContaining({
        key: '프로그램명',
        enabled: false,
        requiresProgram: true,
        programGroups: ['GENERAL'],
      }),
    ])
  })
})
