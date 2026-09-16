import { describe, expect, it } from 'vitest'
import {
  mapPreferredScheduleBlocks,
  mapTrainedTeacherOrganizationApplicationToRow,
} from './organization-applications-adapters'

describe('mapTrainedTeacherOrganizationApplicationToRow', () => {
  it('maps core list fields', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 42,
        programId: 7,
        schoolName: '서울초',
        teacherName: '김교사',
        teacherPhoneMasked: '010-****-1234',
        classCount: 3,
        studentCount: 90,
        applicationStatus: 'APPROVED',
        submittedAt: '2026-07-01T00:00:00Z',
        desiredEducationScheduleMemo: '3월 희망',
      },
      0,
      'fallback-program'
    )
    expect(row.id).toBe('42')
    expect(row.programId).toBe('7')
    expect(row.schoolName).toBe('서울초')
    expect(row.teacherName).toBe('김교사')
    expect(row.classCount).toBe(3)
    expect(row.studentCount).toBe(90)
    expect(row.approvalStatus).toBe('approved')
    expect(row.desiredEducationPeriod).toBe('3월 희망')
    expect(row.preferredScheduleBlocks).toEqual([])
  })

  it('falls back to organizationName and pending status', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1,
        organizationName: '기관A',
        applicationStatus: 'WAITING_REVIEW',
      },
      2,
      'p1'
    )
    expect(row.no).toBe(3)
    expect(row.schoolName).toBe('기관A')
    expect(row.approvalStatus).toBe('pending')
    expect(row.programId).toBe('p1')
  })

  it('maps preferredScheduleBlocks without parsing memo', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 186311,
        programId: 186001,
        desiredEducationScheduleMemo: '레거시 메모는 blocks로 쓰지 않음',
        preferredScheduleBlocks: [
          {
            preferenceRank: 2,
            date: '2026-07-09',
            dayOfWeek: '목',
            sessionCount: 1,
            sessionTimes: [
              {
                sessionIndex: 1,
                classPeriod: '2교시',
                startTime: '11:00',
                endTime: '12:00',
                timeRange: '11:00 ~ 12:00',
              },
            ],
          },
          {
            preferenceRank: 1,
            date: '2026-07-08',
            dayOfWeek: '수',
            sessionCount: 1,
            sessionTimes: [
              {
                sessionIndex: 1,
                classPeriod: '1교시',
                timeRange: '10:00 ~ 11:00',
              },
            ],
          },
        ],
      },
      0,
      '186001'
    )
    expect(row.detail?.otherRequests).toBe('레거시 메모는 blocks로 쓰지 않음')
    expect(row.preferredScheduleBlocks).toHaveLength(2)
    expect(row.preferredScheduleBlocks?.[0].preferenceRank).toBe(1)
    expect(row.preferredScheduleBlocks?.[0].date).toBe('2026-07-08')
    expect(row.preferredScheduleBlocks?.[0].sessionTimes[0].classPeriod).toBe('1교시')
  })
  it('maps progress completeness additive fields (0 is not missing)', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 186341,
        programId: 186004,
        educationTarget: '초등',
        educationGrade: '5~6학년',
        lectureRound: '총 4회',
        totalEducationRoundCount: 4,
        completedEducationRoundCount: 2,
        progressLabel: '진행 중',
        textbookName: 'JA 경제생활 첫걸음',
        educationJournalCount: 0,
        journalSubmitted: false,
        educationCompletionCount: 0,
      },
      0,
      '186004'
    )
    expect(row.educationGrade).toBe('5~6학년')
    expect(row.lectureRound).toBe('총 4회')
    expect(row.progressLabel).toBe('진행 중')
    expect(row.textbookName).toBe('JA 경제생활 첫걸음')
    expect(row.totalEducationRoundCount).toBe(4)
    expect(row.completedEducationRoundCount).toBe(2)
    expect(row.educationJournalCount).toBe(0)
    expect(row.journalSubmitted).toBe(false)
    expect(row.educationCompletionCount).toBe(0)
  })
})

describe('mapPreferredScheduleBlocks', () => {
  it('returns empty array for null/omit and builds timeRange from start/end', () => {
    expect(mapPreferredScheduleBlocks(null)).toEqual([])
    expect(mapPreferredScheduleBlocks(undefined)).toEqual([])
    const mapped = mapPreferredScheduleBlocks([
      {
        preferenceRank: 1,
        date: '2026-07-08',
        dayOfWeek: '수',
        sessionTimes: [{ sessionIndex: 1, classPeriod: '1교시', startTime: '10:00', endTime: '11:00' }],
      },
    ])
    expect(mapped[0].sessionTimes[0].timeRange).toBe('10:00 ~ 11:00')
  })
})
