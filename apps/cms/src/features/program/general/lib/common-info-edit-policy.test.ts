import { describe, expect, it } from 'vitest'
import {
  canGeneralProgramCommonInfoEdit,
  canGeneralProgramRecruitmentInfoEdit,
  getGeneralProgramCommonInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertMessage,
  isGeneralProgramLockedByBusinessStartDate,
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
    startDate: '2026-12-31',
    endDate: '2027-12-31',
    status: 'active',
    lifecycleStatus: 'recruiting_students',
    ...overrides,
  } as Program
}

describe('canGeneralProgramCommonInfoEdit', () => {
  it('프로그램 진행 예정 + 사업 시작일 이전이면 수정 가능', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-12-31' }),
        '2026-07-15'
      )
    ).toBe(true)
  })

  it('프로그램 진행 중·완료 단계에서는 수정 불가', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'education_in_progress' }),
        '2026-07-15'
      )
    ).toBe(false)
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'education_completed' }),
        '2026-07-15'
      )
    ).toBe(false)
  })

  it('사업 시작일 당일·이후에는 lifecycle이 예정이어도 수정 불가', () => {
    const program = baseProgram({
      lifecycleStatus: 'recruiting_students',
      startDate: '2026-07-15',
    })
    expect(canGeneralProgramCommonInfoEdit(program, '2026-07-15')).toBe(false)
    expect(canGeneralProgramCommonInfoEdit(program, '2026-07-16')).toBe(false)
    expect(resolveGeneralProgramInfoEditBlockReason(program, '2026-07-15')).toBe(
      'business_start_locked'
    )
  })
})

describe('isGeneralProgramLockedByBusinessStartDate', () => {
  it('사업 시작일 전날까지는 잠금 아님', () => {
    expect(
      isGeneralProgramLockedByBusinessStartDate(
        baseProgram({ startDate: '2026-07-16' }),
        '2026-07-15'
      )
    ).toBe(false)
  })
})

describe('getGeneralProgramCommonInfoEditBlockedAlertMessage', () => {
  it('진행 중·완료·사업 시작 잠금에 따라 안내 문구를 반환한다', () => {
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'education_after_textbook' }),
        '2026-07-15'
      )
    ).toContain('진행 중')
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'document_processing_completed' }),
        '2026-07-15'
      )
    ).toContain('완료')
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(
        baseProgram({
          lifecycleStatus: 'recruiting_students',
          startDate: '2026-07-01',
        }),
        '2026-07-15'
      )
    ).toContain('사업 시작일')
  })
})

describe('canGeneralProgramRecruitmentInfoEdit', () => {
  it('공통 정보와 동일하게 사업 시작일 가드를 적용한다', () => {
    expect(
      canGeneralProgramRecruitmentInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-12-31' }),
        '2026-07-15'
      )
    ).toBe(true)
    expect(
      canGeneralProgramRecruitmentInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-07-01' }),
        '2026-07-15'
      )
    ).toBe(false)
  })
})

describe('getGeneralProgramRecruitmentInfoEditBlockedAlertMessage', () => {
  it('진행 중·완료에 따라 모집 정보 안내 문구를 반환한다', () => {
    expect(
      getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'education_after_textbook' }),
        '2026-07-15'
      )
    ).toContain('모집 정보')
    expect(
      getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'document_processing_completed' }),
        '2026-07-15'
      )
    ).toContain('모집 정보')
  })
})
