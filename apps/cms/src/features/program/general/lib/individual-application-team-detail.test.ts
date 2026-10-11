import { describe, expect, it } from 'vitest'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { resolveIndividualApplicationTeamDetail } from './individual-application-team-detail'

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
