import { describe, expect, it } from 'vitest'
import {
  appendParticipantSurveyViewRows,
  buildParticipatingIndividualParticipantAssignmentRowsFromAssigned,
  mergeParticipantDetailAssignmentRowsWithRemote,
} from './participating-individual-participant-assignment'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantAssignmentRow } from './participating-individual-participant-assignment-types'
import type { ParticipatingIndividualProgressAssignmentSessionGroup } from './participating-individual-progress-assignment-types'

const localRow: ParticipatingIndividualParticipantAssignmentRow = {
  id: 'asg-11-0',
  scheduleId: '801',
  sessionOrder: 1,
  teamRole: 'member',
  teamName: '1조',
  scheduleLabel: '2026.04.01(수) | 1교시',
  assignmentPeriodLabel: null,
  submission: { kind: 'none' },
  educationProgress: 'completed',
  countsTowardAssignmentDenominator: true,
  isTeamSchedule: true,
  countsTowardSurveyDenominator: false,
}

const remoteSession = (
  overrides?: Partial<ParticipatingIndividualProgressAssignmentSessionGroup>
): ParticipatingIndividualProgressAssignmentSessionGroup => ({
  id: '801',
  round: 1,
  filterValue: '801',
  filterLabel: '1회차 · 2026.04.01',
  headerTitle: '1회차 과제',
  headerDateLabel: '2026.04.01',
  headerScheduleSummary: '1회차 · 2026.04.01',
  headerPeriodRangeLabel: '2026.04.01',
  assignmentPeriodLabel: '2026.04.01 ~ 2026.04.07',
  headerPrefix: '1회차',
  scheduleEducationProgress: 'completed',
  participants: [
    {
      id: 'asgn-11',
      participantId: '11',
      name: '김참여자',
      genderBirthLabel: '여 | 2010.01.01',
      affiliationGradeLabel: '학교 | 5학년',
      affiliation: '학교',
      educationGrade: '5학년',
      submission: {
        kind: 'submitted',
        fileName: '과제.pdf',
        href: '#',
        fileObjectId: 9001,
        downloadable: true,
      },
      remarkKind: 'none',
    },
  ],
  ...overrides,
})

describe('mergeParticipantDetailAssignmentRowsWithRemote', () => {
  it('builds rows from remote only when local rows are empty', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [],
      remoteSessions: [remoteSession()],
    })
    expect(merged).toHaveLength(1)
    expect(merged[0]?.submission).toMatchObject({
      kind: 'attachments',
      items: [{ kind: 'file', fileName: '과제.pdf', fileObjectId: 9001, downloadable: true }],
    })
  })

  it('joins assignment-submissions files onto the matching participant row', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [localRow],
      remoteSessions: [remoteSession()],
    })
    expect(merged).toHaveLength(1)
    expect(merged[0]?.submission).toMatchObject({
      kind: 'attachments',
      items: [{ kind: 'file', fileName: '과제.pdf', fileObjectId: 9001, downloadable: true }],
    })
    expect(merged[0]?.assignmentPeriodLabel).toBe('2026.04.01 ~ 2026.04.07')
    expect(merged[0]?.teamName).toBe('1조')
  })

  it('appends survey view rows when additive keys exist', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [localRow],
      remoteSessions: [],
      surveyResponse: { templateVersionId: 12, formResponseId: 3401 },
      satisfactionResponse: { templateVersionId: 15, formResponseId: 3402 },
    })
    expect(merged).toHaveLength(3)
    expect(merged[1]?.submission).toMatchObject({
      kind: 'survey_view',
      submitted: true,
      templateVersionId: 12,
      formResponseId: 3401,
    })
    expect(merged[2]?.submission).toMatchObject({
      kind: 'satisfaction_survey_view',
      submitted: true,
      templateVersionId: 15,
      formResponseId: 3402,
    })
  })

  it('prefers assignment-submissions survey keys over participant keys', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [localRow],
      remoteSessions: [
        remoteSession({
          participants: [
            {
              id: 'asgn-11',
              participantId: '11',
              name: '김참여자',
              genderBirthLabel: '여 | 2010.01.01',
              affiliationGradeLabel: '학교 | 5학년',
              affiliation: '학교',
              educationGrade: '5학년',
              submission: { kind: 'not_submitted' },
              remarkKind: 'none',
              surveyResponse: { templateVersionId: 99, formResponseId: 8801 },
            },
          ],
        }),
      ],
      surveyResponse: { templateVersionId: 12, formResponseId: 3401 },
    })
    expect(merged.some(row => row.submission.kind === 'survey_view')).toBe(true)
    const surveyRow = merged.find(row => row.submission.kind === 'survey_view')
    expect(surveyRow?.submission).toMatchObject({
      kind: 'survey_view',
      templateVersionId: 99,
      formResponseId: 8801,
    })
  })

  it('keeps local rows when remote has no matching participant', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '99',
      localRows: [localRow],
      remoteSessions: [remoteSession()],
    })
    expect(merged).toHaveLength(1)
    expect(merged[0]?.submission).toEqual(localRow.submission)
    expect(merged[0]?.scheduleLabel).toBe(localRow.scheduleLabel)
    expect(merged[0]?.assignmentPeriodLabel).toBe('2026.04.01 ~ 2026.04.07')
  })

  it('overlays files and due dates by scheduleId without shifting later rows', () => {
    const first: ParticipatingIndividualParticipantAssignmentRow = {
      ...localRow,
      scheduleId: '187612',
      sessionOrder: 1,
      scheduleLabel: '2026.10.30(금) | 개인일정111',
      assignmentPeriodLabel: null,
    }
    const second: ParticipatingIndividualParticipantAssignmentRow = {
      ...localRow,
      id: 'asg-11-2',
      scheduleId: '187613',
      sessionOrder: 2,
      scheduleLabel: '2026.10.30(금) | 팀일정111',
      assignmentPeriodLabel: null,
      submission: { kind: 'none' },
    }
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [first, second],
      remoteSessions: [
        remoteSession({
          id: '187612',
          assignmentPeriodLabel: '2026.10.20 ~ 2026.10.27',
        }),
      ],
    })
    expect(merged.map(row => row.scheduleId)).toEqual(['187612', '187613'])
    expect(merged[0]?.assignmentPeriodLabel).toBe('2026.10.20 ~ 2026.10.27')
    expect(merged[0]?.submission).toMatchObject({
      kind: 'attachments',
      items: [{ kind: 'file', fileName: '과제.pdf' }],
    })
    expect(merged[1]?.assignmentPeriodLabel).toBeNull()
    expect(merged[1]?.submission).toEqual({ kind: 'none' })
  })

  it('keeps education progress from the schedule, not assignment submission status', () => {
    const scheduledLocal: ParticipatingIndividualParticipantAssignmentRow = {
      ...localRow,
      educationProgress: 'completed',
      countsTowardAssignmentDenominator: true,
    }
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [scheduledLocal],
      remoteSessions: [
        remoteSession({
          scheduleEducationProgress: 'completed',
          participants: [
            {
              id: 'asgn-11',
              participantId: '11',
              name: '김참여자',
              genderBirthLabel: '여 | 2010.01.01',
              affiliationGradeLabel: '학교 | 5학년',
              affiliation: '학교',
              educationGrade: '5학년',
              submission: { kind: 'scheduled' },
              remarkKind: 'none',
            },
          ],
        }),
      ],
    })
    expect(merged[0]?.educationProgress).toBe('completed')
    expect(merged[0]?.countsTowardAssignmentDenominator).toBe(true)
    expect(merged[0]?.submission).toEqual({ kind: 'none' })
  })

  it('uses remote schedule bounds for education progress when local rows are empty', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [],
      remoteSessions: [
        remoteSession({
          scheduleEducationProgress: 'completed',
          participants: [
            {
              id: 'asgn-11',
              participantId: '11',
              name: '김참여자',
              genderBirthLabel: '여 | 2010.01.01',
              affiliationGradeLabel: '학교 | 5학년',
              affiliation: '학교',
              educationGrade: '5학년',
              submission: { kind: 'scheduled' },
              remarkKind: 'none',
            },
          ],
        }),
      ],
    })
    expect(merged[0]?.educationProgress).toBe('completed')
    expect(merged[0]?.countsTowardAssignmentDenominator).toBe(true)
  })

  it('maps remote link submissions as external URLs, not downloadable files', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [localRow],
      remoteSessions: [
        remoteSession({
          participants: [
            {
              id: 'asgn-11',
              participantId: '11',
              name: '김참여자',
              genderBirthLabel: '여 | 2010.01.01',
              affiliationGradeLabel: '학교 | 5학년',
              affiliation: '학교',
              educationGrade: '5학년',
              submission: {
                kind: 'submitted',
                fileName: '제출 파일',
                href: '#',
                items: [
                  {
                    kind: 'link',
                    fileName: 'https://www.jakorea.org',
                    href: 'https://www.jakorea.org',
                  },
                  {
                    kind: 'file',
                    fileName: '과제.pdf',
                    href: '#',
                    fileObjectId: 9001,
                    downloadable: true,
                  },
                ],
              },
              remarkKind: 'none',
            },
          ],
        }),
      ],
    })
    expect(merged[0]?.submission).toEqual({
      kind: 'attachments',
      items: [
        { kind: 'link', label: 'https://www.jakorea.org', href: 'https://www.jakorea.org' },
        {
          kind: 'file',
          fileName: '과제.pdf',
          fileObjectId: 9001,
          downloadable: true,
        },
      ],
    })
  })
})

function assignmentParticipant(): ParticipatingIndividualParticipantRow {
  return {
    id: '11',
    lectureAttendanceSessions: [],
    satisfactionSurveyCompleted: false,
    participationAppliedAt: '2026-03-01',
  } as unknown as ParticipatingIndividualParticipantRow
}

describe('buildParticipatingIndividualParticipantAssignmentRowsFromAssigned', () => {
  it('omits pre-education so assignment due dates stay on main sessions', () => {
    const assigned: ParticipatingSchoolSession[] = [
      {
        round: 0,
        date: '2026.10.30',
        dayOfWeek: '금',
        duration: '40분',
        format: '-',
        classNum: '-',
        timeRange: '21:20 ~ 22:00',
        resolvedScheduleId: 187614,
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:1',
        scheduleName: '사전 교육',
        deliveryScheduleStatus: 'COMPLETED',
      },
      {
        round: 1,
        date: '2026.10.30',
        dayOfWeek: '금',
        duration: '5분',
        format: '-',
        classNum: '-',
        timeRange: '21:25 ~ 21:30',
        resolvedScheduleId: 187612,
        scheduleName: '개인일정111',
        deliveryScheduleStatus: 'COMPLETED',
      },
    ]
    const rows = buildParticipatingIndividualParticipantAssignmentRowsFromAssigned({
      assignedSessions: assigned,
      participant: assignmentParticipant(),
      program: {
        id: '186507',
        generalProgramSessionRound: 'multi',
        schedules: [
          { id: 187614, scheduleName: '사전 교육', scheduleRole: 'PRE_EDUCATION' },
          { id: 187612, scheduleName: '개인일정111' },
        ],
      } as Program,
    })

    expect(rows.map(row => row.scheduleId)).toEqual(['187612'])
    expect(rows.map(row => row.sessionOrder)).toEqual([1])
    expect(rows[0]?.scheduleLabel).toContain('개인일정111')
    expect(rows[0]?.scheduleLabel).not.toContain('사전교육')
  })

  it('keeps assigned main sessions when there is no pre-education', () => {
    const assigned: ParticipatingSchoolSession[] = [
      {
        round: 1,
        date: '2026.10.30',
        dayOfWeek: '금',
        duration: '5분',
        format: '-',
        classNum: '-',
        timeRange: '21:25 ~ 21:30',
        resolvedScheduleId: 187612,
        scheduleName: '개인일정111',
        deliveryScheduleStatus: 'COMPLETED',
      },
      {
        round: 2,
        date: '2026.10.30',
        dayOfWeek: '금',
        duration: '5분',
        format: '-',
        classNum: '-',
        timeRange: '21:40 ~ 21:42',
        resolvedScheduleId: 187613,
        scheduleName: '팀일정111',
        deliveryScheduleStatus: 'COMPLETED',
      },
    ]
    const rows = buildParticipatingIndividualParticipantAssignmentRowsFromAssigned({
      assignedSessions: assigned,
      participant: assignmentParticipant(),
      program: {
        id: '186507',
        generalProgramSessionRound: 'multi',
        schedules: [
          { id: 187612, scheduleName: '개인일정111' },
          { id: 187613, scheduleName: '팀일정111' },
        ],
      } as Program,
    })

    expect(rows.map(row => row.scheduleId)).toEqual(['187612', '187613'])
    expect(rows.map(row => row.sessionOrder)).toEqual([1, 2])
    expect(rows[0]?.scheduleLabel).toContain('개인일정111')
    expect(rows[1]?.scheduleLabel).toContain('팀일정111')
  })
})

describe('appendParticipantSurveyViewRows', () => {
  it('does not invent rows when keys are missing', () => {
    expect(
      appendParticipantSurveyViewRows({
        participantId: '11',
        rows: [localRow],
      })
    ).toEqual([localRow])
  })
})
