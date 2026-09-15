import { describe, expect, it } from 'vitest'
import {
  canGeneralProgramCommonInfoEdit,
  canGeneralProgramRecruitmentInfoEdit,
  getGeneralProgramCommonInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertMessage,
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
    endDate: '2027-12-31',
    status: 'active',
    lifecycleStatus: 'recruiting_students',
    ...overrides,
  } as Program
}

describe('canGeneralProgramCommonInfoEdit', () => {
  it('프로그램 진행 예정이면 사업 시작일 경과와 무관하게 수정 가능', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-01-01' })
      )
    ).toBe(true)
    expect(
      resolveGeneralProgramInfoEditBlockReason(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-01-01' })
      )
    ).toBeNull()
  })

  it('프로그램 진행 중·완료 단계에서는 수정 불가', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'education_in_progress' })
      )
    ).toBe(false)
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'education_completed' })
      )
    ).toBe(false)
  })
})

describe('getGeneralProgramCommonInfoEditBlockedAlertMessage', () => {
  it('진행 중·완료에 따라 안내 문구를 반환한다', () => {
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'education_after_textbook' })
      )
    ).toContain('진행 중')
    expect(
      getGeneralProgramCommonInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'document_processing_completed' })
      )
    ).toContain('완료')
  })
})

describe('canGeneralProgramRecruitmentInfoEdit', () => {
  it('공통 정보와 동일하게 lifecycle 가드만 적용한다', () => {
    expect(
      canGeneralProgramRecruitmentInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students', startDate: '2026-01-01' })
      )
    ).toBe(true)
    expect(
      canGeneralProgramRecruitmentInfoEdit(
        baseProgram({ lifecycleStatus: 'education_in_progress' })
      )
    ).toBe(false)
  })
})

describe('getGeneralProgramRecruitmentInfoEditBlockedAlertMessage', () => {
  it('진행 중·완료에 따라 모집 정보 안내 문구를 반환한다', () => {
    expect(
      getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'education_after_textbook' })
      )
    ).toContain('모집 정보')
    expect(
      getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
        baseProgram({ lifecycleStatus: 'document_processing_completed' })
      )
    ).toContain('모집 정보')
  })
})
