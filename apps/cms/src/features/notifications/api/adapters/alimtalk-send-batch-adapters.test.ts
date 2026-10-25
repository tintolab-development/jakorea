import { describe, expect, it } from 'vitest'
import {
  buildCreateSendBatchRequest,
  collectTemplatePlaceholderKeys,
  findMissingAlimtalkTemplateVariableKeys,
  formatAlimtalkFailedReason,
  formatAlimtalkMissingVariablesMessage,
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
  toTemplateVariablesRequestParams,
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

  it('MEMBER+actorId는 신원 키만 서버 치환으로 보고 SYSTEM 값은 있다고 보지 않는다', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['사용자 아이디(이메일)', '휴면 전환일시'],
      recipients: [{ actorType: 'MEMBER', actorId: 12 }],
    })
    expect(missing).toEqual(['휴면 전환일시'])
  })

  it('DIRECT는 예약·SYSTEM 키를 batch variables로 충족하지 않는다', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['사용자 아이디(이메일)', '휴면 전환일시'],
      batchVariables: {
        '사용자 아이디(이메일)': 'user@example.com',
        '휴면 전환일시': '2026-09-08 12:00',
      },
      recipients: [{ actorType: 'DIRECT', source: 'manual' }],
    })
    expect(missing).toEqual(['사용자 아이디(이메일)', '휴면 전환일시'])
  })

  it('수신자 한 명의 커스텀 값이 다른 수신자를 충족시키지 않는다', () => {
    const missing = findMissingAlimtalkTemplateVariableKeys({
      requiredKeys: ['안내문'],
      catalog: [],
      recipients: [
        {
          actorType: 'DIRECT',
          source: 'manual',
          variables: { 안내문: '오전 안내' },
        },
        { actorType: 'DIRECT', source: 'manual' },
      ],
    })
    expect(missing).toEqual(['안내문'])
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
    // 예약 키(회원명·프로그램명)는 variables에서 제외
    expect(pickNonEmptySendVariables({ 회원명: '홍길동', 프로그램명: 'A' })).toBeUndefined()
    expect(pickNonEmptySendVariables({ 커스텀키: '값', 회원명: '홍길동' })).toEqual({
      커스텀키: '값',
    })
  })

  it('programId가 있으면 포함하고 variables는 기본 생략한다', () => {
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
    expect(request).not.toHaveProperty('titleTemplate')
    expect(request).not.toHaveProperty('contentTemplate')
    expect(request.recipients[0]).toMatchObject({
      actorType: 'MEMBER',
      actorId: 1,
    })
  })

  it('programId 미전달 시 필드를 omit 한다', () => {
    const request = buildCreateSendBatchRequest({
      batchName: 'direct-smoke',
      templateId: 11,
      recipients: [
        {
          id: 'manual-1',
          participationType: '',
          name: '직접',
          phone: '010-1234-5678',
          source: 'manual',
          actorType: 'DIRECT',
        },
      ],
    })
    expect(request).not.toHaveProperty('programId')
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
    expect(request.recipients[0]).not.toHaveProperty('variables')
  })

  it('직접 입력 수신자의 수동 변수만 recipients[].variables로 전달한다', () => {
    const request = buildCreateSendBatchRequest({
      batchName: '알림톡 발송',
      templateId: 11,
      placeholderKeys: ['안내문', '휴면 전환일시', '회원명'],
      variableCatalog: [],
      recipients: [
        {
          id: 'manual-1',
          participationType: '',
          name: '직접',
          phone: '010-3333-4444',
          source: 'manual',
          actorType: 'DIRECT',
          variables: {
            안내문: '  오후 교육  ',
            '휴면 전환일시': '2026-01-01',
            회원명: '홍길동',
            빈값: '   ',
          },
        },
      ],
    })
    expect(request.recipients[0]).toEqual({
      actorType: 'DIRECT',
      recipientContact: '01033334444',
      recipientName: '직접',
      variables: { 안내문: '오후 교육' },
    })
  })

  it('같은 휴대폰 번호는 발송 DTO에서 1건만 남긴다', () => {
    const request = buildCreateSendBatchRequest({
      batchName: '알림톡 발송',
      templateId: 11,
      recipients: [
        {
          id: 'actor-MEMBER-1',
          participationType: 'participant',
          name: '회원',
          phone: '010-1111-2222',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 1,
        },
        {
          id: 'manual-01011112222',
          participationType: '',
          name: '직접',
          phone: '01011112222',
          source: 'manual',
          actorType: 'DIRECT',
        },
        {
          id: 'actor-MEMBER-2',
          participationType: 'participant',
          name: '다른 회원',
          phone: '010-9999-8888',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 2,
        },
      ],
    })
    expect(request.recipients).toEqual([
      { actorType: 'MEMBER', actorId: 1 },
      { actorType: 'MEMBER', actorId: 2 },
    ])
  })

  it('enabled를 BE 값 그대로 옮기고 로컬 재계산하지 않는다', () => {
    const mapped = mapTemplateVariablesCatalog({
      totalCount: 2,
      systemManualSendQaEnabled: false,
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
              recruitmentTypes: [],
              participantTypes: [],
              memberTypes: ['GENERAL'],
            },
            {
              key: '프로그램명',
              token: '#{프로그램명}',
              description: '프로그램',
              requiresProgram: true,
              enabled: false,
              programGroups: ['GENERAL'],
              recruitmentTypes: [],
              participantTypes: [],
              memberTypes: [],
            },
          ],
        },
      ],
    })
    expect(mapped.systemManualSendQaEnabled).toBe(false)
    expect(mapped.variables).toEqual([
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

  it('systemManualSendQaEnabled를 BE 값 그대로 옮긴다', () => {
    const mapped = mapTemplateVariablesCatalog({
      totalCount: 0,
      categories: [],
      systemManualSendQaEnabled: true,
    })
    expect(mapped).toEqual({
      variables: [],
      systemManualSendQaEnabled: true,
    })
  })
})

describe('toTemplateVariablesRequestParams', () => {
  it('programId 미선택 시 쿼리에서 제외한다', () => {
    expect(
      toTemplateVariablesRequestParams({
        programId: undefined,
        participantType: 'PARTICIPANT',
      })
    ).toEqual({ participantType: 'PARTICIPANT' })
    expect(toTemplateVariablesRequestParams({})).toEqual({})
  })

  it('유효한 programId만 포함한다', () => {
    expect(toTemplateVariablesRequestParams({ programId: 162371 })).toEqual({
      programId: 162371,
    })
  })
})
