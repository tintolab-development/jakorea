import { describe, expect, it } from 'vitest'
import {
  isNotificationCatalogVariableDisabled,
  isNotificationCatalogVariablePendingRecipientType,
} from './catalog-variable-disabled'
import { formatNotificationFailedReason } from './format-notification-failed-reason'

describe('isNotificationCatalogVariableDisabled', () => {
  it('BE enabled=false 이면 비활성', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: false, requiresProgram: false }, 1)
    ).toBe(true)
  })

  it('enabled=true 이고 프로그램 있으면 활성', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: true, requiresProgram: true }, 10)
    ).toBe(false)
  })

  it('requiresProgram 인데 programId 없으면 FE 가드', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: true, requiresProgram: true }, null)
    ).toBe(true)
  })
})

describe('formatNotificationFailedReason', () => {
  it('누락 코드+키를 사용자 문구로 변환한다', () => {
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간'
      )
    ).toBe('자동입력 변수값이 없어 발송되지 않았습니다: 교육 진행 수업 시간')
  })

  it('복수 키는 쉼표+공백으로 표시한다', () => {
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간,배정 기관명'
      )
    ).toBe('자동입력 변수값이 없어 발송되지 않았습니다: 교육 진행 수업 시간, 배정 기관명')
  })
})

describe('isNotificationCatalogVariablePendingRecipientType', () => {
  const schoolOnly = {
    enabled: false,
    requiresProgram: true,
    programGroups: [],
    recruitmentTypes: [],
    participantTypes: ['PARTICIPANT'],
    memberTypes: ['SCHOOL_TEACHER', 'TEACHER_AND_INSTRUCTOR'],
  }

  it('수신자 유형 없이 조회해 비활성이면 대기로 본다', () => {
    expect(isNotificationCatalogVariablePendingRecipientType(schoolOnly, 186506, {})).toBe(true)
  })

  it('지정한 유형 하나가 맞고 나머지가 미정이면 대기로 본다', () => {
    expect(
      isNotificationCatalogVariablePendingRecipientType(schoolOnly, 186506, {
        participantType: 'PARTICIPANT',
      })
    ).toBe(true)
  })

  it('지정한 유형이 조건에 맞지 않으면 대기가 아니다', () => {
    expect(
      isNotificationCatalogVariablePendingRecipientType(schoolOnly, 186506, {
        participantType: 'INSTRUCTOR',
      })
    ).toBe(false)
    expect(
      isNotificationCatalogVariablePendingRecipientType(schoolOnly, 186506, {
        memberType: 'GENERAL',
      })
    ).toBe(false)
  })

  it('프로그램이 필요한데 없으면 대기가 아니다', () => {
    expect(isNotificationCatalogVariablePendingRecipientType(schoolOnly, null, {})).toBe(false)
  })

  it('유형 조건이 없거나 프로그램 그룹·모집 유형 조건이 있으면 대기가 아니다', () => {
    expect(
      isNotificationCatalogVariablePendingRecipientType(
        { enabled: false, requiresProgram: true, participantTypes: [], memberTypes: [] },
        1,
        {}
      )
    ).toBe(false)
    expect(
      isNotificationCatalogVariablePendingRecipientType(
        { ...schoolOnly, programGroups: ['GENERAL'] },
        1,
        {}
      )
    ).toBe(false)
  })

  it('템플릿 선택 단계가 아니면(범위 미전달) 대기로 보지 않는다', () => {
    expect(isNotificationCatalogVariablePendingRecipientType(schoolOnly, 1, undefined)).toBe(false)
  })
})
