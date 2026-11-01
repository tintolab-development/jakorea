import { describe, expect, it } from 'vitest'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import {
  INDIVIDUAL_TEAM_EDIT_AFTER_APPROVAL_ALERT,
  isIndividualApplicationApprovedOnlyUpdateError,
  resolveIndividualApplicationTeamDetail,
} from './individual-application-team-detail'

describe('resolveIndividualApplicationTeamDetail', () => {
  it('maps BE GET team projection (name, memberCount, role)', () => {
    expect(
      resolveIndividualApplicationTeamDetail({
        team: { name: '우리팀', memberCount: 3, role: 'LEADER' },
      })
    ).toEqual({
      teamName: '우리팀',
      teamMemberCount: 3,
      teamMemberCountSelect: '3',
      teamRole: 'leader',
    })
  })

  it('maps OpenAPI Team shape (teamName only) from API team', () => {
    expect(
      resolveIndividualApplicationTeamDetail({
        team: { teamId: 1, teamName: '관리자 수정 팀명' },
      })
    ).toEqual({
      teamName: '관리자 수정 팀명',
      teamMemberCount: undefined,
      teamMemberCountSelect: undefined,
      teamRole: undefined,
    })
  })

  it('reads team paragraph answer from formAnswers when team object is empty', () => {
    expect(
      resolveIndividualApplicationTeamDetail({
        team: null,
        formAnswers: {
          [PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo]: {
            teamName: '플랫폼 팀',
            memberCountSelect: 'custom',
            customMemberCount: '7',
            teamRole: 'member',
          },
        },
      })
    ).toEqual({
      teamName: '플랫폼 팀',
      teamMemberCount: 7,
      teamMemberCountSelect: 'custom',
      teamRole: 'member',
    })
  })

  it('prefers API team fields over formAnswers when both exist', () => {
    expect(
      resolveIndividualApplicationTeamDetail({
        team: { teamName: '운영 팀', memberCount: 2, role: 'LEADER' },
        formAnswers: {
          [PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo]: {
            teamName: '신청 팀',
            memberCountSelect: '5',
            teamRole: 'member',
          },
        },
      })
    ).toEqual({
      teamName: '운영 팀',
      teamMemberCount: 2,
      teamMemberCountSelect: '2',
      teamRole: 'leader',
    })
  })
})

describe('isIndividualApplicationApprovedOnlyUpdateError', () => {
  it('maps the approved-only PATCH error to the 팀 정보 수정 안내 copy', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '승인된 개인 신청에서만 정보를 수정할 수 있습니다.',
          error: {
            code: 'INDIVIDUAL_APPLICATION_NOT_APPROVED',
            message: '승인된 개인 신청에서만 정보를 수정할 수 있습니다.',
          },
        },
      },
    }
    expect(isIndividualApplicationApprovedOnlyUpdateError(error)).toBe(true)
    expect(INDIVIDUAL_TEAM_EDIT_AFTER_APPROVAL_ALERT).toEqual({
      title: '팀 정보 수정 안내',
      content: '참여자 신청 승인 후에 팀 정보를 변경할 수 있습니다.',
    })
  })
})
