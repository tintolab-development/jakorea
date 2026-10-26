import { describe, expect, it } from 'vitest'
import { canSubmitEducationAssignment } from '../src/features/mypage/education/schedules/lib/schedule-rules'
import { mapPortalEducationSchedule } from '../src/features/mypage/education/schedules/lib/map-from-portal'

describe('portal education schedule contract', () => {
  it('keeps team information isolated per schedule item', () => {
    const leader = mapPortalEducationSchedule(
      { scheduleId: 501, sessionNo: 2, teamRole: 'LEADER', teamName: '드림메이커스' },
      0,
    )
    const member = mapPortalEducationSchedule(
      { scheduleId: 30, sessionNo: 3, teamRole: 'MEMBER', teamName: '변경 팀' },
      1,
    )
    const individual = mapPortalEducationSchedule(
      { scheduleId: 31, sessionNo: 4, teamRole: 'INDIVIDUAL', teamName: null },
      2,
    )
    const nonTeam = mapPortalEducationSchedule(
      { scheduleId: 32, sessionNo: 5, teamRole: null, teamName: '무시' },
      3,
    )

    expect(leader.team).toEqual({ roleLabel: '팀장', teamName: '드림메이커스' })
    expect(member.team).toEqual({ roleLabel: '팀원', teamName: '변경 팀' })
    expect(individual.team).toEqual({ roleLabel: '개인', teamName: '-' })
    expect(nonTeam.team).toBeUndefined()
  })

  it('does not create assignment UI data for instructor or volunteer schedules', () => {
    const assignment = { enabled: true, canSubmit: true }

    expect(
      mapPortalEducationSchedule(
        { scheduleId: 1, assignment },
        0,
        { applicationType: 'INSTRUCTOR' },
      ).assignment,
    ).toBeUndefined()
    expect(
      mapPortalEducationSchedule(
        { scheduleId: 2, assignment },
        0,
        { applicationType: 'VOLUNTEER' },
      ).assignment,
    ).toBeUndefined()
  })

  it('uses canSubmit and canResubmit as the only button permission source', () => {
    expect(canSubmitEducationAssignment({ canSubmit: true }, 'submit')).toBe(true)
    expect(canSubmitEducationAssignment({ canSubmit: false }, 'submit')).toBe(false)
    expect(canSubmitEducationAssignment({}, 'submit')).toBe(false)
    expect(canSubmitEducationAssignment({ canResubmit: true }, 'revise')).toBe(true)
    expect(canSubmitEducationAssignment({ canResubmit: false }, 'revise')).toBe(false)
    expect(canSubmitEducationAssignment({}, 'revise')).toBe(false)
  })
})
