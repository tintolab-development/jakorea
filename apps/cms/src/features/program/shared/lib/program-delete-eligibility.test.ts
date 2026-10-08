import { describe, expect, it } from 'vitest'
import { resolveProgramListDeleteBlocked } from './program-delete-eligibility'

describe('resolveProgramListDeleteBlocked', () => {
  it('예정 단계 · 참여자 없음 → 삭제 가능', () => {
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'recruiting_students' })).toBe(false)
  })

  it('승인 참여자가 있으면 삭제 불가', () => {
    expect(
      resolveProgramListDeleteBlocked({ lifecycleStatus: 'scheduled', participantApprovedCount: 1 })
    ).toBe(true)
    expect(
      resolveProgramListDeleteBlocked({
        lifecycleStatus: 'scheduled',
        approvedOrganizationApplicationCount: 2,
      })
    ).toBe(true)
  })

  it('진행 중 · 완료 단계는 삭제 불가', () => {
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'in_progress' })).toBe(true)
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'education_completed' })).toBe(true)
  })

  it('UJAT — 진행 현황 기준', () => {
    expect(
      resolveProgramListDeleteBlocked({ ujatProgressStatus: 'PARTICIPANT_RECRUITING' })
    ).toBe(false)
    expect(
      resolveProgramListDeleteBlocked({ ujatProgressStatus: 'EDUCATION_IN_PROGRESS' })
    ).toBe(true)
    expect(resolveProgramListDeleteBlocked({ ujatProgressStatus: 'PROGRAM_ENDED' })).toBe(true)
  })

  it('0·null 카운트는 무시', () => {
    expect(
      resolveProgramListDeleteBlocked({
        lifecycleStatus: 'planned',
        participantApprovedCount: 0,
        participatingSchoolCount: null,
      })
    ).toBe(false)
  })
})
