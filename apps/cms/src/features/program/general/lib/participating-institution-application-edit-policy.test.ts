import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  canParticipatingInstitutionApplicationInfoEdit,
  getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage,
} from './participating-institution-application-edit-policy'

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

describe('canParticipatingInstitutionApplicationInfoEdit', () => {
  it('진행 예정이면 수정 가능', () => {
    expect(
      canParticipatingInstitutionApplicationInfoEdit({
        program: baseProgram({ lifecycleStatus: 'scheduled' }),
        enrollmentStatus: 'EDUCATION_SCHEDULED',
      })
    ).toBe(true)
  })

  it('기관 진행 현황이 진행 중이면 수정 불가', () => {
    expect(
      canParticipatingInstitutionApplicationInfoEdit({
        program: baseProgram({ lifecycleStatus: 'scheduled' }),
        enrollmentStatus: 'EDUCATION_IN_PROGRESS',
      })
    ).toBe(false)
  })

  it('프로그램 lifecycle이 진행 중이면 수정 불가', () => {
    expect(
      canParticipatingInstitutionApplicationInfoEdit({
        program: baseProgram({ lifecycleStatus: 'in_progress' }),
        enrollmentStatus: 'EDUCATION_SCHEDULED',
      })
    ).toBe(false)
  })
})

describe('getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage', () => {
  it('진행 중 안내 문구를 반환한다', () => {
    expect(
      getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage({
        program: baseProgram({ lifecycleStatus: 'in_progress' }),
      })
    ).toContain('진행 중')
  })
})
