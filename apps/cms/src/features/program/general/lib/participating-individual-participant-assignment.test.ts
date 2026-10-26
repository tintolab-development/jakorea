import { describe, expect, it } from 'vitest'
import {
  appendParticipantSurveyViewRows,
  collectParticipantAssignmentDownloadableFiles,
  mergeParticipantDetailAssignmentRowsWithRemote,
} from './participating-individual-participant-assignment'
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
    expect(merged[0]?.submission).toMatchObject({ kind: 'file', fileName: '과제.pdf' })
  })

  it('joins assignment-submissions files onto the matching participant row', () => {
    const merged = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: '11',
      localRows: [localRow],
      remoteSessions: [remoteSession()],
    })
    expect(merged).toHaveLength(1)
    expect(merged[0]?.submission).toMatchObject({
      kind: 'file',
      fileName: '과제.pdf',
      fileObjectId: 9001,
      downloadable: true,
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
    expect(merged).toEqual([localRow])
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

describe('collectParticipantAssignmentDownloadableFiles', () => {
  it('collects downloadable file ids', () => {
    expect(
      collectParticipantAssignmentDownloadableFiles([
        {
          ...localRow,
          submission: {
            kind: 'file',
            fileName: '과제.pdf',
            fileObjectId: 9001,
            downloadable: true,
            secondaryFileName: '보충.pdf',
            secondaryFileObjectId: 9002,
            secondaryDownloadable: true,
          },
        },
      ])
    ).toEqual([
      { fileObjectId: 9001, fileName: '과제.pdf' },
      { fileObjectId: 9002, fileName: '보충.pdf' },
    ])
  })
})
