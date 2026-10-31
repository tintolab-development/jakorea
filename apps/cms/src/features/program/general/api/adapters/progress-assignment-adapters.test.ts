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
                {
                  fileObjectId: 9003,
                  originalFileName: '과제_추가.pdf',
                  downloadable: true,
                },
              ],
              links: [
                { url: 'https://www.jakorea.org', displayName: 'JA Korea 과제 링크' },
                { url: 'https://www.naver.com' },
              ],
            },
            {
              participantId: 1002,
              memberName: '김미정',
              submissionStatus: 'NOT_SUBMITTED',
              remarkKind: 'NONE',
              files: [],
              surveyResponse: { templateVersionId: 12, formResponseId: 3401 },
              satisfactionResponse: null,
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
    expect(sessions[0]?.headerTitle).toBe('1회차 : 2026.10.20(화)')
    expect(sessions[0]?.assignmentPeriodLabel).toBe('2026.10.20(화) ~ 2026.10.27(화)')
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
    expect(sessions[0]?.participants[0]?.submission).toMatchObject({
      kind: 'submitted',
      files: [
        { fileObjectId: 9001, fileName: '과제_제출.pdf' },
        { fileObjectId: 9002, fileName: '과제_보충.pdf' },
        { fileObjectId: 9003, fileName: '과제_추가.pdf' },
      ],
      items: [
        { kind: 'file', fileName: '과제_제출.pdf' },
        { kind: 'file', fileName: '과제_보충.pdf' },
        { kind: 'file', fileName: '과제_추가.pdf' },
        { kind: 'link', fileName: 'JA Korea 과제 링크', href: 'https://www.jakorea.org' },
        { kind: 'link', fileName: 'https://www.naver.com', href: 'https://www.naver.com' },
      ],
    })
    expect(sessions[0]?.participants[0]?.genderBirthLabel).toContain('남')
    expect(sessions[0]?.participants[0]?.surveyResponse).toBeUndefined()
    expect(sessions[0]?.participants[1]?.submission).toEqual({ kind: 'not_submitted' })
    expect(sessions[0]?.participants[1]?.surveyResponse).toEqual({
      templateVersionId: 12,
      formResponseId: 3401,
    })
    expect(sessions[0]?.participants[1]?.satisfactionResponse).toBeUndefined()
    expect(sessions[0]?.participants[2]?.submission).toEqual({ kind: 'scheduled' })
  })

  it('omits the time range for all-day schedules (midnight to midnight)', () => {
    const [allDay, timed] = buildProgressAssignmentSessionsFromRemote({
      items: [
        {
          scheduleId: 701,
          sessionNo: 1,
          startAt: '2026-10-13T00:00:00',
          endAt: '2026-10-14T00:00:00',
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

    expect(allDay?.headerTitle).toBe('1회차 : 2026.10.13(화)')
    expect(timed?.headerTitle).toBe('2회차 : 2026.10.20(화)')
    expect(timed?.headerPeriodRangeLabel).toMatch(/10:00\s*~\s*12:00/)
  })

  it('drops schedules without scheduleId and empty items', () => {
    expect(buildProgressAssignmentSessionsFromRemote({ items: [] })).toEqual([])
    expect(
      buildProgressAssignmentSessionsFromRemote({
        items: [{ sessionNo: 1, participants: [] }],
      })
    ).toEqual([])
  })

  it('drops the curriculum period window so 공통 교육 예정 1 becomes 1회차', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote({
      items: [
        {
          scheduleId: 187270,
          sessionNo: 1,
          scheduleName: '개커복날 강사테슽 커리큘럼',
          startAt: '2026-10-23T15:00:00Z',
          endAt: '2026-12-24T14:59:59.999Z',
          participants: [{ participantId: 1, memberName: '일반회원' }],
        },
        {
          scheduleId: 187271,
          sessionNo: null,
          scheduleName: '공통 교육 예정 1',
          startAt: '2026-10-24T07:00:00Z',
          endAt: '2026-10-24T07:02:00Z',
          participants: [{ participantId: 1, memberName: '일반회원' }],
        },
        {
          scheduleId: 187272,
          sessionNo: 2,
          scheduleName: '공통 교육 예정 2',
          startAt: '2026-10-24T07:05:00Z',
          endAt: '2026-10-24T07:06:00Z',
          participants: [{ participantId: 1, memberName: '일반회원' }],
        },
        {
          scheduleId: 187273,
          sessionNo: 3,
          scheduleName: '공통 교육 예정 3',
          startAt: '2026-10-24T07:10:00Z',
          endAt: '2026-10-24T07:11:00Z',
          participants: [{ participantId: 1, memberName: '일반회원' }],
        },
      ],
    })

    expect(sessions.map(session => session.id)).toEqual(['187271', '187272', '187273'])
    expect(sessions.map(session => session.headerTitle)).toEqual([
      '1회차 : 2026.10.24(토)',
      '2회차 : 2026.10.24(토)',
      '3회차 : 2026.10.24(토)',
    ])
    expect(sessions[0]?.headerTitle).not.toContain('12.24')
  })

  it('hides a give-up participant from later assignment tables', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote(
      {
        items: [
          {
            scheduleId: 1,
            sessionNo: 1,
            startAt: '2026-01-09T09:20:00+09:00',
            assignmentPeriodStart: '2026-01-05T00:00:00+09:00',
            assignmentPeriodEnd: '2026-01-09T23:59:59+09:00',
            participants: [
              { participantId: 10, memberName: '포기자' },
              { participantId: 11, memberName: '진행자' },
            ],
          },
          {
            scheduleId: 2,
            sessionNo: 2,
            startAt: '2026-01-16T09:20:00+09:00',
            participants: [
              { participantId: 10, memberName: '포기자' },
              { participantId: 11, memberName: '진행자' },
            ],
          },
        ],
      },
      {
        giveUpParticipants: [
          {
            participantId: 10,
            participantStatus: 'GIVE_UP',
            giveUpAt: '2026-01-09T18:00:00+09:00',
          },
        ],
      }
    )

    expect(sessions[0]?.headerTitle).toBe('1회차 : 2026.01.09(금)')
    expect(sessions[0]?.assignmentPeriodLabel).toBe('2026.01.05(월) ~ 2026.01.09(금)')
    expect(sessions[0]?.participants.map(row => row.name)).toEqual(['포기자', '진행자'])
    expect(sessions[1]?.participants.map(row => row.name)).toEqual(['진행자'])
  })

  it('fills assignment sessions that arrived without participants from the progress roster', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote(
      {
        items: [
          {
            scheduleId: 901,
            sessionNo: 1,
            startAt: '2026-01-09T00:20:00Z',
            endAt: '2026-01-09T02:20:00Z',
            participants: [],
          },
        ],
      },
      {
        participants: [
          {
            participantId: 21,
            memberName: '김제이',
            participantType: 'INDIVIDUAL',
            organizationName: '제이초등학교',
            grade: '3학년',
          },
        ],
      }
    )

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.participants.map(row => row.name)).toEqual(['김제이'])
    expect(sessions[0]?.participants[0]?.submission).toEqual({ kind: 'not_submitted' })
  })

  it('falls back to education schedules and participant roster when assignment items are empty', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote(
      { items: [] },
      {
        schedules: [
          {
            scheduleId: 801,
            sessionNo: 1,
            scheduleName: '1회차',
            startAt: '2026-01-09T00:20:00Z',
            endAt: '2026-01-09T02:20:00Z',
            scheduleRole: 'EDUCATION',
          },
          {
            scheduleId: 802,
            sessionNo: 2,
            scheduleName: '2회차',
            startAt: '2026-01-12T00:20:00Z',
            endAt: '2026-01-12T02:20:00Z',
            scheduleRole: 'SESSION',
          },
        ],
        participants: [
          {
            participantId: 11,
            memberName: '김제이',
            participantType: 'INDIVIDUAL',
            organizationName: '제이초등학교',
            grade: '3학년',
            gender: 'FEMALE',
            birthDate: '2000-01-01',
          },
        ],
      }
    )

    expect(sessions.map(session => session.id)).toEqual(['801', '802'])
    expect(sessions[0]?.participants.map(row => row.name)).toEqual(['김제이'])
    expect(sessions[0]?.participants[0]?.submission).toEqual({ kind: 'not_submitted' })
    expect(sessions[1]?.participants.map(row => row.name)).toEqual(['김제이'])
  })
})
