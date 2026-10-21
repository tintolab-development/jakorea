import { describe, expect, it } from 'vitest'
import { buildProgressAssignmentSessionsFromRemote } from './progress-assignment-adapters'

describe('buildProgressAssignmentSessionsFromRemote', () => {
  it('maps schedule groups and participant submission rows', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote({
      items: [
        {
          scheduleId: 601,
          sessionNo: 1,
          scheduleName: '1회차',
          startAt: '2026-10-20T01:00:00Z',
          endAt: '2026-10-20T03:00:00Z',
          assignmentEnabled: true,
          assignmentPeriodStart: '2026-10-20T00:00:00+09:00',
          assignmentPeriodEnd: '2026-10-27T23:59:59+09:00',
          participants: [
            {
              participantId: 1001,
              memberName: '홍길동',
              gender: 'MALE',
              birthDate: '2008-03-01',
              affiliation: '○○중학교',
              grade: '2학년',
              submissionStatus: 'SUBMITTED',
              remarkKind: 'FEEDBACK_DELIVERED',
              remarkAt: '2026-10-21T00:00:00Z',
              files: [
                {
                  fileObjectId: 9001,
                  originalFileName: '과제_제출.pdf',
                  downloadable: true,
                },
                {
                  fileObjectId: 9002,
                  originalFileName: '과제_보충.pdf',
                  downloadable: true,
                },
              ],
            },
            {
              participantId: 1002,
              memberName: '김미정',
              submissionStatus: 'NOT_SUBMITTED',
              remarkKind: 'NONE',
              files: [],
            },
            {
              participantId: 1003,
              memberName: '이예정',
              submissionStatus: 'SCHEDULED',
              files: [],
            },
          ],
        },
      ],
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.id).toBe('601')
    expect(sessions[0]?.headerTitle).toBe('1회차 과제')
    expect(sessions[0]?.assignmentPeriodLabel).toBe('2026. 10. 20(화) ~ 2026. 10. 27(화)')
    expect(sessions[0]?.participants[0]).toMatchObject({
      participantId: '1001',
      name: '홍길동',
      educationGrade: '2학년',
      remarkKind: 'feedback_delivered',
      remarkDateLabel: '26.10.21',
      submission: {
        kind: 'submitted',
        fileName: '과제_제출.pdf',
        fileObjectId: 9001,
        downloadable: true,
        secondaryFileName: '과제_보충.pdf',
        secondaryFileObjectId: 9002,
      },
    })
    expect(sessions[0]?.participants[0]?.genderBirthLabel).toContain('남')
    expect(sessions[0]?.participants[1]?.submission).toEqual({ kind: 'not_submitted' })
    expect(sessions[0]?.participants[2]?.submission).toEqual({ kind: 'scheduled' })
  })

  it('omits the time range for all-day schedules (midnight to midnight)', () => {
    const [allDay, timed] = buildProgressAssignmentSessionsFromRemote({
      items: [
        {
          scheduleId: 701,
          sessionNo: 1,
          startAt: '2026-10-13T00:00:00',
          endAt: '2026-11-08T00:00:00',
          participants: [],
        },
        {
          scheduleId: 702,
          sessionNo: 2,
          startAt: '2026-10-20T10:00:00',
          endAt: '2026-10-20T12:00:00',
          participants: [],
        },
      ],
    })

    expect(allDay?.headerScheduleSummary).toBe('1회차 · 2026. 10. 13(화)')
    expect(timed?.headerScheduleSummary).toBe('2회차 · 2026. 10. 20(화) 10:00 ~ 12:00')
  })

  it('drops schedules without scheduleId and empty items', () => {
    expect(buildProgressAssignmentSessionsFromRemote({ items: [] })).toEqual([])
    expect(
      buildProgressAssignmentSessionsFromRemote({
        items: [{ sessionNo: 1, participants: [] }],
      })
    ).toEqual([])
  })
})
