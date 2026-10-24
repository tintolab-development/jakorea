import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getEarliestPersistedRecruitmentStartAt,
  isCommonInfoEditPeriodOpen,
  isOperationStartDateLocked,
  isProgramFormBindingWriteLocked,
  isProgramOperationStartLocked,
  isProgramRecruitmentTypeLocked,
  isProgramStructureEditPeriodOpen,
  isProgramTypeSettingsChanged,
  isProgramTypeSettingsSaveBlocked,
  isRecruitmentStartLocked,
  isRecruitmentTypeGeneralInfoClosed,
  resolveRecruitmentTypeForFormBinding,
} from './program-edit-window'

function programWith(recruitments: Program['programRecruitments']): Program {
  return {
    id: '1',
    sponsorId: 'sponsor-1',
    title: 't',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    programRecruitments: recruitments,
  } as Program
}

describe('isCommonInfoEditPeriodOpen', () => {
  it('사업 종료일 당일 한국 시간은 저장 가능하고 다음 날 00:00부터 불가하다', () => {
    const end = '2026-11-07'
    expect(isCommonInfoEditPeriodOpen(end, new Date('2026-11-07T14:59:00+09:00'))).toBe(true)
    expect(isCommonInfoEditPeriodOpen(end, new Date('2026-11-08T00:00:00+09:00'))).toBe(false)
  })

  it('종료일이 없으면 막지 않는다', () => {
    expect(isCommonInfoEditPeriodOpen(undefined, new Date('2026-11-08T00:00:00+09:00'))).toBe(
      true
    )
  })
})

describe('isRecruitmentStartLocked', () => {
  it('startAt이 속한 분부터 잠그고, 1분 전과 null은 열어둡니다', () => {
    const startAt = '2026-10-01T10:15:40+09:00'
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:14:59+09:00'))).toBe(false)
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:15:00+09:00'))).toBe(true)
    expect(isRecruitmentStartLocked(startAt, new Date('2026-10-01T10:16:00+09:00'))).toBe(true)
    expect(isRecruitmentStartLocked(null, new Date('2026-10-01T10:16:00+09:00'))).toBe(false)
    expect(isRecruitmentStartLocked(undefined, new Date('2026-10-01T10:16:00+09:00'))).toBe(false)
  })
})

describe('isProgramOperationStartLocked', () => {
  it('운영 시작일 당일부터 잠그고, 날짜가 없으면 열어둡니다', () => {
    expect(isOperationStartDateLocked('2026-09-28', new Date('2026-09-27T23:59:00+09:00'))).toBe(
      false
    )
    expect(isOperationStartDateLocked('2026-09-28', new Date('2026-09-28T00:00:00+09:00'))).toBe(
      true
    )
    expect(isOperationStartDateLocked(null, new Date('2026-09-28T12:00:00+09:00'))).toBe(false)
  })

  it('모집이 시작돼도 운영 시작일이 다른 유형은 따로 판단한다', () => {
    const program = programWith([
      {
        recruitmentType: 'PARTICIPANT',
        startAt: '2020-01-01T00:00:00+09:00',
        operationStartDate: '2099-01-01',
      },
      { recruitmentType: 'INSTRUCTOR', operationStartDate: '2020-06-01' },
      { recruitmentType: 'VOLUNTEER', startAt: '2020-01-01T00:00:00+09:00' },
    ])
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(isProgramOperationStartLocked(program, 'PARTICIPANT', now)).toBe(false)
    expect(isProgramOperationStartLocked(program, 'INSTRUCTOR', now)).toBe(true)
    expect(isProgramOperationStartLocked(program, 'VOLUNTEER', now)).toBe(false)
    expect(isProgramRecruitmentTypeLocked(program, 'VOLUNTEER', now)).toBe(true)
  })
})

describe('isRecruitmentTypeGeneralInfoClosed', () => {
  const now = new Date('2026-09-28T12:00:00+09:00')

  it('저장된 행이 모두 시작한 뒤에만 그 유형의 일반 정보를 닫는다', () => {
    const program = programWith([
      { id: 1, recruitmentType: 'VOLUNTEER', startAt: '2020-01-01T00:00:00+09:00' },
      { id: 2, recruitmentType: 'VOLUNTEER', startAt: '2099-06-01T00:00:00+09:00' },
      { id: 3, recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
    ])
    expect(isRecruitmentTypeGeneralInfoClosed(program, 'VOLUNTEER', now)).toBe(false)
    expect(isRecruitmentTypeGeneralInfoClosed(program, 'PARTICIPANT', now)).toBe(true)
    expect(isProgramRecruitmentTypeLocked(program, 'VOLUNTEER', now)).toBe(true)
  })

  it('id가 없는 행만 있으면 일반 정보를 닫지 않는다', () => {
    const program = programWith([
      { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
    ])
    expect(isRecruitmentTypeGeneralInfoClosed(program, 'PARTICIPANT', now)).toBe(false)
  })
})

describe('isProgramRecruitmentTypeLocked', () => {
  it('지난 유형만 잠그고 다른 유형은 연다', () => {
    const program = programWith([
      { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      { recruitmentType: 'INSTRUCTOR', startAt: '2099-01-01T00:00:00+09:00' },
      { recruitmentType: 'VOLUNTEER', startAt: null },
    ])
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(isProgramRecruitmentTypeLocked(program, 'PARTICIPANT', now)).toBe(true)
    expect(isProgramRecruitmentTypeLocked(program, 'INSTRUCTOR', now)).toBe(false)
    expect(isProgramRecruitmentTypeLocked(program, 'VOLUNTEER', now)).toBe(false)
  })
})

describe('getEarliestPersistedRecruitmentStartAt', () => {
  it('여러 모집 유형 행 중 가장 빠른 저장된 startAt을 고른다', () => {
    const program = programWith([
      { id: 3, recruitmentType: 'VOLUNTEER', startAt: '2026-06-01T00:00:00+09:00' },
      { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2026-03-01T09:00:00+09:00' },
      { id: 2, recruitmentType: 'INSTRUCTOR', startAt: '2026-04-15T00:00:00+09:00' },
    ])
    expect(getEarliestPersistedRecruitmentStartAt(program)).toBe('2026-03-01T09:00:00+09:00')
  })

  it('id 없는 행과 파싱 실패 startAt은 제외한다', () => {
    const program = programWith([
      { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      { id: 2, recruitmentType: 'INSTRUCTOR', startAt: 'not-a-date' },
      { id: 3, recruitmentType: 'VOLUNTEER', startAt: '2026-09-01T00:00:00+09:00' },
    ])
    expect(getEarliestPersistedRecruitmentStartAt(program)).toBe('2026-09-01T00:00:00+09:00')
  })

  it('유효한 저장된 startAt이 없으면 null이다', () => {
    expect(getEarliestPersistedRecruitmentStartAt(programWith([]))).toBeNull()
    expect(
      getEarliestPersistedRecruitmentStartAt(
        programWith([{ id: 1, recruitmentType: 'PARTICIPANT', startAt: null }])
      )
    ).toBeNull()
  })
})

describe('isProgramStructureEditPeriodOpen', () => {
  const startAt = '2026-10-01T10:15:40+09:00'

  it('가장 빠른 startAt 1분 전까지 열고 그 분부터 닫는다', () => {
    const program = programWith([
      { id: 1, recruitmentType: 'INSTRUCTOR', startAt: '2026-11-01T00:00:00+09:00' },
      { id: 2, recruitmentType: 'PARTICIPANT', startAt },
    ])
    expect(
      isProgramStructureEditPeriodOpen(program, new Date('2026-10-01T10:14:59+09:00'))
    ).toBe(true)
    expect(
      isProgramStructureEditPeriodOpen(program, new Date('2026-10-01T10:15:00+09:00'))
    ).toBe(false)
  })

  it('저장된 startAt이 없으면 연다', () => {
    expect(
      isProgramStructureEditPeriodOpen(programWith([]), new Date('2026-10-01T10:16:00+09:00'))
    ).toBe(true)
  })
})

describe('isProgramTypeSettingsSaveBlocked', () => {
  const now = new Date('2026-09-28T12:00:00+09:00')
  const lockedProgram = programWith([
    { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
  ])
  const openProgram = programWith([
    { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2099-01-01T00:00:00+09:00' },
  ])

  it('잠긴 뒤 교육 구조 또는 회차 변경은 막는다', () => {
    const existing = {
      ...lockedProgram,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
    }
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        { educationStructure: 'schedule', sessionRound: 'single' },
        now
      )
    ).toBe(true)
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        { educationStructure: 'curriculum', sessionRound: 'multi' },
        now
      )
    ).toBe(true)
  })

  it('잠긴 뒤에도 구조·회차가 같으면 막지 않는다', () => {
    const existing = {
      ...lockedProgram,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
    }
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        { educationStructure: 'curriculum', sessionRound: 'single' },
        now
      )
    ).toBe(false)
    expect(isProgramTypeSettingsChanged(existing, {})).toBe(false)
  })

  it('가장 빠른 모집 시작 전에는 구조 변경을 막지 않는다', () => {
    const existing = {
      ...openProgram,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
    }
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        { educationStructure: 'schedule', sessionRound: 'multi' },
        now
      )
    ).toBe(false)
  })

  it('잠긴 뒤 참여 방식 또는 일정 공통/상이 변경은 막는다', () => {
    const existing = {
      ...lockedProgram,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
      generalCommonInfo: {
        participationMethod: 'individual' as const,
        participationScheduleDetail: 'common' as const,
      },
    }
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          participationMethod: 'team',
        },
        now
      )
    ).toBe(true)
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          participationScheduleDetail: 'perSchedule',
        },
        now
      )
    ).toBe(true)
  })

  it('잠긴 뒤에도 참여 방식이 같으면 막지 않는다', () => {
    const existing = {
      ...lockedProgram,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
      generalCommonInfo: {
        participationMethod: 'individual' as const,
        participationScheduleDetail: 'common' as const,
      },
    }
    expect(
      isProgramTypeSettingsSaveBlocked(
        existing,
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          participationMethod: 'individual',
          participationScheduleDetail: 'common',
        },
        now
      )
    ).toBe(false)
  })
})

describe('resolveRecruitmentTypeForFormBinding', () => {
  it('바인딩 값을 모집 유형으로 맞춘다', () => {
    expect(resolveRecruitmentTypeForFormBinding('SCHOOL', null)).toBe('PARTICIPANT')
    expect(resolveRecruitmentTypeForFormBinding(null, 'TEACHER')).toBe('INSTRUCTOR')
    expect(resolveRecruitmentTypeForFormBinding('STUDENT', null)).toBe('VOLUNTEER')
    expect(resolveRecruitmentTypeForFormBinding('SURVEY', null)).toBeNull()
  })

  it('모집이 시작된 바인딩만 쓰기를 막는다', () => {
    const program = programWith([
      { recruitmentType: 'INSTRUCTOR', startAt: '2020-01-01T00:00:00+09:00' },
    ])
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(isProgramFormBindingWriteLocked(program, 'TEACHER', null, now)).toBe(true)
    expect(isProgramFormBindingWriteLocked(program, 'ORGANIZATION', null, now)).toBe(false)
  })
})
