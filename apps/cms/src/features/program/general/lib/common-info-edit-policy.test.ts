import { describe, expect, it } from 'vitest'
import {
  canGeneralProgramCommonInfoEdit,
  getGeneralProgramCommonInfoEditBlockedAlertMessage,
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
    ...overrides,
  } as Program
}

describe('canGeneralProgramCommonInfoEdit', () => {
  it('프로그램 진행 예정 단계에서만 수정 가능', () => {
    expect(
      canGeneralProgramCommonInfoEdit(
        baseProgram({ lifecycleStatus: 'recruiting_students' })
      )
    ).toBe(true)
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
