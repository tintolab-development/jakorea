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
    expect(getGeneralProgramCommonInfoEditBlockedAlertMessage(baseProgram())).toContain('공통 정보')
  })
})

describe('canGeneralProgramRecruitmentInfoEdit', () => {
  it('모집이 시작돼도 운영 시작일 전이면 그 모집 정보를 수정할 수 있다', () => {
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
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(true)
    expect(
      canGeneralProgramApplicationFormEdit(program, 'PARTICIPANT', { applicationCount: 0 })
    ).toBe(true)
  })

  it('운영 시작일 당일부터 그 모집 유형만 닫는다', () => {
    const program = baseProgram({
      programRecruitments: [
        { id: 11, recruitmentType: 'PARTICIPANT', operationStartDate: '2026-06-01' },
        { id: 12, recruitmentType: 'INSTRUCTOR', operationStartDate: '2099-01-01' },
        { id: 13, recruitmentType: 'VOLUNTEER', operationStartDate: '2026-06-02' },
      ],
    })
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(false)
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'INSTRUCTOR', duringBusiness)).toBe(true)
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'VOLUNTEER', duringBusiness)).toBe(true)
    expect(
      canGeneralProgramApplicationFormEdit(program, 'VOLUNTEER', { applicationCount: 0 })
    ).toBe(true)
  })

  it('모집 시작일이 오늘이어도 신청 0건이면 양식 수정을 선차단하지 않는다', () => {
    const program = baseProgram({
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          startAt: '2026-06-01T00:00:00+09:00',
          applicationFormBindingId: 77,
        },
      ],
    })
    expect(
      canGeneralProgramApplicationFormEdit(program, 'PARTICIPANT', {
        applicationCount: 0,
        hasBinding: true,
      })
    ).toBe(true)
  })

  it('모집별 신청 건수가 있으면 잠그되 바인딩이 없으면 항상 허용한다', () => {
    const program = baseProgram({
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          applicationFormBindingId: 77,
        },
      ],
    })
    expect(
      canGeneralProgramApplicationFormEdit(program, 'PARTICIPANT', {
        applicationCount: 1,
        hasBinding: true,
      })
    ).toBe(false)
    expect(
      canGeneralProgramApplicationFormEdit(program, 'PARTICIPANT', {
        applicationCount: 1,
        hasBinding: false,
      })
    ).toBe(true)
  })

  it('운영 시작일이 없으면 모집 일반 정보를 닫지 않는다', () => {
    const program = baseProgram({
      programRecruitments: [
        { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      ],
    })
    expect(canGeneralProgramRecruitmentInfoEdit(program, 'PARTICIPANT', duringBusiness)).toBe(true)
  })
})

describe('getGeneralProgramRecruitmentInfoEditBlockedAlertMessage', () => {
  it('운영 시작 이후 안내를 반환한다', () => {
    expect(getGeneralProgramRecruitmentInfoEditBlockedAlertTitle()).toBe('정보 수정 불가 안내')
    expect(getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(baseProgram())).toBe(
      '해당 모집 유형의 프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.'
    )
  })
})
