import { describe, expect, it } from 'vitest'
import {
  canGeneralProgramApplicationFormEdit,
  canGeneralProgramCommonInfoEdit,
  canGeneralProgramRecruitmentInfoEdit,
  getGeneralProgramCommonInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertTitle,
  resolveGeneralProgramInfoEditBlockReason,
} from './common-info-edit-policy'
import type { Program } from '@/types/domain'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    lifecycleStatus: 'recruiting_students',
    ...overrides,
  } as Program
}

const duringBusiness = new Date('2026-06-01T12:00:00+09:00')
const afterBusinessEnd = new Date('2027-01-01T00:00:00+09:00')

describe('canGeneralProgramCommonInfoEdit', () => {
  it('사업 종료일 당일까지는 진행 단계와 무관하게 수정 가능', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'education_in_progress', endDate: '2026-12-31' }),
        duringBusiness
      )
    ).toBe(true)
    expect(
      resolveGeneralProgramInfoEditBlockReason(
        baseProgram({ lifecycleStatus: 'education_completed', endDate: '2026-12-31' }),
        duringBusiness
      )
    ).toBeNull()
  })

  it('사업 종료일 다음 날부터 수정 불가', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', endDate: '2026-12-31' }),
        afterBusinessEnd
      )
    ).toBe(false)
    expect(
      resolveGeneralProgramInfoEditBlockReason(
        baseProgram({ endDate: '2026-12-31' }),
        afterBusinessEnd
      )
    ).toBe('period_ended')
  })
})

describe('getGeneralProgramCommonInfoEditBlockedAlertMessage', () => {
  it('사업 종료 안내를 반환한다', () => {
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(baseProgram())
    ).toContain('공통 정보')
  })
})

describe('canGeneralProgramRecruitmentInfoEdit', () => {
  it('모집 시작이 지나면 운영 시작일이 미래여도 그 모집 일반 정보는 닫는다', () => {
    const program = baseProgram({
      lifecycleStatus: 'education_in_progress',
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          startAt: '2020-01-01T00:00:00+09:00',
          operationStartDate: '2099-01-01',
        },
      ],
    })
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(
      false
    )
    expect(canGeneralProgramApplicationFormEdit(program, 'PARTICIPANT', duringBusiness)).toBe(
      false
    )
  })

  it('시작하지 않은 모집행은 다른 유형이 시작해도 수정할 수 있다', () => {
    const program = baseProgram({
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          startAt: '2020-01-01T00:00:00+09:00',
        },
        { id: 12, recruitmentType: 'INSTRUCTOR', startAt: '2099-01-01T00:00:00+09:00' },
        { id: 13, recruitmentType: 'VOLUNTEER', startAt: '2020-01-01T00:00:00+09:00' },
        { id: 14, recruitmentType: 'VOLUNTEER', startAt: '2099-06-01T00:00:00+09:00' },
      ],
    })
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(
      false
    )
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'INSTRUCTOR', duringBusiness)).toBe(true)
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'VOLUNTEER', duringBusiness)).toBe(true)
    expect(canGeneralProgramApplicationFormEdit(program, 'VOLUNTEER', duringBusiness)).toBe(false)
  })

  it('저장된 행이 없으면 모집 일반 정보를 닫지 않는다', () => {
    const program = baseProgram({
      programRecruitments: [
        { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      ],
    })
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(true)
  })
})

describe('getGeneralProgramRecruitmentInfoEditBlockedAlertMessage', () => {
  it('모집 시작 이후 안내를 반환한다', () => {
    expect(getGeneralProgramRecruitmentInfoEditBlockedAlertTitle()).toBe(
      '모집 정보 수정 불가 안내'
    )
    expect(getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(baseProgram())).toBe(
      '모집 시작 후에는 모집 정보를 수정할 수 없습니다.'
    )
  })
})
