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
    expect(individual.team).toEqual({ roleLabel: '개인' })
    expect(nonTeam.team).toBeUndefined()
  })

  it('maps per-schedule team fields for mixed individual/team events without copying answers', () => {
    const preEducation = mapPortalEducationSchedule(
      {
        scheduleId: 187614,
        scheduleLabel: '사전 교육',
        scheduleName: '사전 교육',
        blockKind: 'PRE_EDUCATION',
        teamRole: null,
        teamName: null,
      },
      0,
    )
    const individualEvent = mapPortalEducationSchedule(
      {
        scheduleId: 187612,
        scheduleLabel: '행사 일정 01',
        scheduleName: '개인일정111',
        blockKind: 'EVENT',
        teamRole: 'INDIVIDUAL',
        teamName: null,
        assignment: { enabled: true, status: 'NOT_SUBMITTED', canSubmit: true },
      },
      1,
    )
    const teamEvent = mapPortalEducationSchedule(
      {
        scheduleId: 187613,
        scheduleLabel: '행사 일정 02',
        scheduleName: '팀일정111',
        blockKind: 'EVENT',
        teamRole: 'MEMBER',
        teamName: '아자자',
        assignment: { enabled: true, status: 'NOT_SUBMITTED', canSubmit: false },
      },
      2,
    )

    expect(preEducation.team).toBeUndefined()
    expect(individualEvent.team).toEqual({ roleLabel: '개인' })
    expect(teamEvent.team).toEqual({ roleLabel: '팀원', teamName: '아자자' })
    expect(canSubmitEducationAssignment(individualEvent.assignment!, 'submit')).toBe(true)
    expect(canSubmitEducationAssignment(teamEvent.assignment!, 'submit')).toBe(false)
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

  it('maps approved assignment responseStatus without treating FEEDBACK as resubmittable', () => {
    const item = mapPortalEducationSchedule(
      {
        scheduleId: 187630,
        assignment: {
          enabled: true,
          status: 'FEEDBACK',
          responseStatus: 'APPROVED',
          formResponseId: 1852101,
          canSubmit: false,
          canResubmit: false,
        },
        availableActions: [],
      },
      0,
    )
    expect(item.assignment?.status).toBe('feedback')
    expect(item.assignment?.responseStatus).toBe('APPROVED')
    expect(item.assignment?.canResubmit).toBe(false)
    expect(canSubmitEducationAssignment(item.assignment!, 'revise', item.availableActions)).toBe(
      false,
    )
  })

  it('uses canSubmit and canResubmit as the only button permission source', () => {
    expect(canSubmitEducationAssignment({ canSubmit: true }, 'submit')).toBe(true)
    expect(canSubmitEducationAssignment({ canSubmit: false }, 'submit')).toBe(false)
    expect(canSubmitEducationAssignment({}, 'submit')).toBe(false)
    expect(canSubmitEducationAssignment({ canResubmit: true }, 'revise')).toBe(true)
    expect(canSubmitEducationAssignment({ canResubmit: false }, 'revise')).toBe(false)
    expect(canSubmitEducationAssignment({}, 'revise')).toBe(false)
    expect(
      canSubmitEducationAssignment({ canResubmit: false }, 'revise', ['SUBMIT_ASSIGNMENT']),
    ).toBe(true)
    expect(
      canSubmitEducationAssignment({ canSubmit: false, canResubmit: false }, 'revise', []),
    ).toBe(false)
  })

  it('maps APPROVED assignment flags without enabling resubmit', () => {
    const item = mapPortalEducationSchedule(
      {
        scheduleId: 187630,
        assignment: {
          enabled: true,
          status: 'FEEDBACK',
          responseStatus: 'APPROVED',
          formResponseId: 1852101,
          canSubmit: false,
          canResubmit: false,
        },
        availableActions: [],
      },
      0,
    )
    expect(item.assignment?.status).toBe('feedback')
    expect(item.assignment?.responseStatus).toBe('APPROVED')
    expect(item.assignment?.canSubmit).toBe(false)
    expect(item.assignment?.canResubmit).toBe(false)
    expect(
      canSubmitEducationAssignment(item.assignment!, 'revise', item.availableActions),
    ).toBe(false)
  })
})
