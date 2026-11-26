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

  it('진행 중 · 완료 상태만으로는 삭제 선택을 차단하지 않는다', () => {
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'in_progress' })).toBe(false)
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'education_completed' })).toBe(false)
    expect(resolveProgramListDeleteBlocked({ lifecycleStatus: 'completed' })).toBe(false)
  })

  it('UJAT도 진행 상태가 아니라 실제 참여 인원으로 사전 차단한다', () => {
    expect(
      resolveProgramListDeleteBlocked({ ujatProgressStatus: 'PARTICIPANT_RECRUITING' })
    ).toBe(false)
    expect(
      resolveProgramListDeleteBlocked({ ujatProgressStatus: 'EDUCATION_IN_PROGRESS' })
    ).toBe(false)
    expect(resolveProgramListDeleteBlocked({ ujatProgressStatus: 'PROGRAM_ENDED' })).toBe(false)
    expect(
      resolveProgramListDeleteBlocked({
        ujatProgressStatus: 'PROGRAM_ENDED',
        participantApprovedCount: 1,
      })
    ).toBe(true)
  })

  it('진행·완료 상태여도 확인된 참여자가 있으면 기존 체크박스 제한을 유지한다', () => {
    expect(
      resolveProgramListDeleteBlocked({ lifecycleStatus: 'in_progress', participantApprovedCount: 1 })
    ).toBe(true)
    expect(
      resolveProgramListDeleteBlocked({ lifecycleStatus: 'completed', approvedOrganizationApplicationCount: 1 })
    ).toBe(true)
    expect(resolveProgramListDeleteBlocked({ participatingSchoolCount: 1 })).toBe(true)
    expect(resolveProgramListDeleteBlocked({ participatingStudentCount: 1 })).toBe(true)
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
