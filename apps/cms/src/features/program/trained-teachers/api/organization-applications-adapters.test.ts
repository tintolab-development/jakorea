import { describe, expect, it } from 'vitest'
import { mapApplicantSchoolToParticipatingSchool } from './education-journals-service'
import { getSchoolDetailByRow } from '@/features/program/general/lib/school-detail'
import {
  mapPreferredScheduleBlocks,
  mapPreferredScheduleBlocksToSessions,
  mapProgramSchedulesToPreferredScheduleBlocks,
  mapTrainedTeacherOrganizationApplicationToRow,
} from './organization-applications-adapters'

describe('mapTrainedTeacherOrganizationApplicationToRow', () => {
  it('maps textbookDeliveryStatus onto the applicant row badge', () => {
    const fromRoot = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691599,
        textbookName: '성공하는 경제생활',
        textbookDeliveryStatus: 'SHIPPING',
      },
      0,
      '186551'
    )
    expect(fromRoot.textbookStatus).toBe('shipping')
    expect(mapApplicantSchoolToParticipatingSchool(fromRoot, 0).textbookStatus).toBe('shipping')

    const fromGradeBlock = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691599,
        textbookName: '성공하는 경제생활',
        gradeBlocks: [{ textbookDeliveryStatus: 'PREPARING' }],
      },
      0,
      '186551'
    )
    expect(fromGradeBlock.textbookStatus).toBe('preparing')

    const prefersRoot = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691599,
        textbookDeliveryStatus: 'DELIVERED',
        gradeBlocks: [{ textbookDeliveryStatus: 'PREPARING' }],
      },
      0,
      '186551'
    )
    expect(prefersRoot.textbookStatus).toBe('delivered')

    const missing = mapTrainedTeacherOrganizationApplicationToRow(
      { applicationId: 1691599, textbookName: '성공하는 경제생활' },
      0,
      '186551'
    )
    expect(missing.textbookStatus).toBeUndefined()
    expect(mapApplicantSchoolToParticipatingSchool(missing, 0).textbookStatus).toBe(
      'not_applicable'
    )
  })

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
    expect(row.applicationStatus).toBe('APPROVED')
    expect(row.approvalStatus).toBe('approved')
    expect(row.desiredEducationPeriod).toBe('3월 희망')
    expect(row.preferredScheduleBlocks).toEqual([])
  })

  it('APPROVAL_CANCELLED를 cancelled 배지 토큰으로 매핑하고 REJECTED로 바꾸지 않는다', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691592,
        applicationStatus: 'APPROVAL_CANCELLED',
        preferredScheduleBlocks: [
          {
            date: '2026-11-07',
            dayOfWeek: '토',
            sessionCount: 1,
            sessionTimes: [],
          },
        ],
      },
      0,
      '186551'
    )
    expect(row.applicationStatus).toBe('APPROVAL_CANCELLED')
    expect(row.approvalStatus).toBe('cancelled')
    expect(row.preferredScheduleBlocks).toHaveLength(1)
    expect(row.preferredScheduleBlocks?.[0]?.date).toBe('2026-11-07')
  })

  it('maps detail gradeBlocks as-is and keeps explicit null', () => {
    const gradeBlocks = [{ gradeLabel: null, classCount: 1, classes: [{ classNo: '4학년 1반' }] }]
    expect(
      mapTrainedTeacherOrganizationApplicationToRow({ applicationId: 1, gradeBlocks }, 0, 'p1')
        .gradeBlocks
    ).toEqual(gradeBlocks)
    expect(
      mapTrainedTeacherOrganizationApplicationToRow({ applicationId: 1, gradeBlocks: null }, 0, 'p1')
        .gradeBlocks
    ).toBeNull()
    expect(
      'gradeBlocks' in mapTrainedTeacherOrganizationApplicationToRow({ applicationId: 1 }, 0, 'p1')
    ).toBe(false)
  })

  it('maps detail educationSchedules to attendance sessions instead of preferred blocks', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1,
        preferredScheduleBlocks: [
          { date: '2026-06-01', sessionCount: 1, sessionTimes: [], scheduleId: 900 },
        ],
        educationSchedules: [
          {
            scheduleId: 501,
            round: 2,
            label: '2회차',
            startAt: '2026-06-05T09:00:00',
            endAt: '2026-06-05T10:00:00',
          },
          { scheduleId: 0, round: 3 },
          {
            scheduleId: 502,
            round: null,
            startAt: '2026-11-06T15:00:00Z',
            endAt: '2026-11-06T16:30:00Z',
          },
        ],
      },
      0,
      'p1'
    )
    expect(row.educationScheduleSessions).toEqual([
      expect.objectContaining({
        round: 2,
        date: '2026.06.05',
        dayOfWeek: '금',
        timeRange: '09:00~10:00',
        resolvedScheduleId: 501,
        educationScheduleLabel: '2회차',
      }),
      expect.objectContaining({
        date: '2026.11.07',
        dayOfWeek: '토',
        timeRange: '00:00~01:30',
        resolvedScheduleId: 502,
      }),
    ])
    expect(
      'educationScheduleSessions' in
        mapTrainedTeacherOrganizationApplicationToRow({ applicationId: 1 }, 0, 'p1')
    ).toBe(false)
  })

  it('maps teacherMemberId for privacy unmask', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 42,
        teacherMemberId: 190001,
        teacherName: '김교사',
        teacherPhoneMasked: '010-****-1234',
        applicationStatus: 'WAITING_REVIEW',
      },
      0,
      'p1'
    )
    expect(row.teacherMemberId).toBe(190001)
    expect(row.contact).toBe('010-****-1234')
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

  it('maps 1691592-style preferredScheduleBlocks and leaves educationSchedules out of hope', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691592,
        programId: 186551,
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-11-17',
            dayOfWeek: '화',
            sessionCount: 1,
            sessionTimes: [
              {
                sessionIndex: 1,
                classPeriod: null as unknown as undefined,
                startTime: '15:07',
                endTime: '16:07',
                timeRange: '15:07 ~ 16:07',
              },
            ],
            scheduleId: 187701,
            label: '공통 교육 예정 1',
            scheduleStatus: 'MATCHED',
          },
          {
            preferenceRank: 2,
            date: '2026-11-16',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [
              {
                sessionIndex: 1,
                classPeriod: '4교시',
                timeRange: '15:07 ~ 16:07',
              },
            ],
            scheduleId: 187704,
            scheduleStatus: 'MATCHED',
          },
          {
            preferenceRank: 3,
            date: '2026-11-19',
            dayOfWeek: '목',
            sessionCount: 1,
            sessionTimes: [
              {
                sessionIndex: 1,
                classPeriod: '2교시',
                timeRange: '15:07 ~ 16:07',
              },
            ],
            scheduleId: 187702,
            scheduleStatus: 'MATCHED',
          },
        ],
        educationSchedules: Array.from({ length: 8 }, (_, index) => ({
          scheduleId: 187700 + index,
          round: index + 1,
          startAt: '2026-11-01T00:00:00+09:00',
          endAt: '2026-11-01T01:00:00+09:00',
        })),
        desiredEducationScheduleMemo: null as unknown as undefined,
      },
      0,
      '186551'
    )
    expect(row.preferredScheduleBlocks).toHaveLength(3)
    expect(row.preferredScheduleBlocks?.map(block => block.scheduleId)).toEqual([
      187701, 187704, 187702,
    ])
    expect(row.preferredScheduleBlocks?.[0].sessionTimes[0].classPeriod).toBe('')
    expect(row.educationScheduleSessions).toHaveLength(8)
    expect(mapPreferredScheduleBlocks(null)).toEqual([])
    expect(mapPreferredScheduleBlocks([])).toEqual([])
  })

  it('maps preferredScheduleBlocks without putting memo into otherRequests', () => {
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
    expect(row.desiredEducationPeriod).toBe('레거시 메모는 blocks로 쓰지 않음')
    expect(row.detail?.otherRequests).toBeUndefined()
    expect(row.preferredScheduleBlocks).toHaveLength(2)
    expect(row.preferredScheduleBlocks?.[0].preferenceRank).toBe(1)
    expect(row.preferredScheduleBlocks?.[0].date).toBe('2026-07-08')
    expect(row.preferredScheduleBlocks?.[0].sessionTimes[0].classPeriod).toBe('1교시')
    expect(row.sessions).toEqual([
      {
        round: 1,
        date: '2026.07.08',
        dayOfWeek: '수',
        duration: '1차시',
        format: '',
        classNum: '1교시',
        timeRange: '10:00~11:00',
        resolvedScheduleId: null,
      },
      {
        round: 2,
        date: '2026.07.09',
        dayOfWeek: '목',
        duration: '1차시',
        format: '',
        classNum: '2교시',
        timeRange: '11:00~12:00',
        resolvedScheduleId: null,
      },
    ])
  })

  it('maps portal basic-info projection fields onto detail', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1698006,
        programId: 186013,
        educationGrade: '3',
        addressDetail: '송파구 ○○로 12',
        applicationReason: '진로 교육 강화',
        otherRequests: '주차 가능 여부 문의',
        requestedEducationFormat: 'ONLINE',
        classCount: 1,
        studentCount: 11,
        desiredEducationScheduleMemo: null as unknown as undefined,
      },
      0,
      '186013'
    )
    expect(row.educationGrade).toBe('3학년')
    expect(row.detail?.addressDetail).toBe('송파구 ○○로 12')
    expect(row.detail?.applicationReason).toBe('진로 교육 강화')
    expect(row.detail?.otherRequests).toBe('주차 가능 여부 문의')
    expect(row.detail?.educationType).toBe('온라인')
    expect(row.classCount).toBe(1)
    expect(row.studentCount).toBe(11)
  })

  it('상세 응답의 flat 전용 필드를 상세 모델로 매핑한다', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1698010,
        schoolName: '상세 학교',
        addressDetail: '2층 교무실',
        requestedEducationFormat: 'HYBRID',
        applicationReason: '상세 신청 사유',
        otherRequests: null,
        teacherEmail: 'teacher@example.com',
        textbookId: 55,
      },
      0,
      '186013'
    )

    expect(row.detail).toMatchObject({
      addressDetail: '2층 교무실',
      educationType: '온/오프라인',
      applicationReason: '상세 신청 사유',
      teacherEmail: 'teacher@example.com',
      textbookId: '55',
    })
    expect(row.detail?.otherRequests).toBeUndefined()
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

  it('maps resultNotificationSentAt and RESEND_NOTIFICATION', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 186311,
        programId: 186001,
        schoolName: '서울초',
        applicationStatus: 'APPROVED',
        resultNotificationSentAt: '2026-09-27T05:00:00Z',
        availableActions: ['VIEW', 'RESEND_NOTIFICATION'],
      },
      0,
      'p1'
    )
    expect(row.availableActions).toContain('RESEND_NOTIFICATION')
    expect(row.approvalNotificationSentAt).toBeTruthy()
  })

  it('preserves the matched program schedule id for attendance API queries', () => {
    const sessions = mapPreferredScheduleBlocksToSessions([
      {
        preferenceRank: 1,
        date: '2026-07-09',
        dayOfWeek: '목',
        sessionCount: 1,
        scheduleId: 9876,
        sessionTimes: [
          {
            sessionIndex: 1,
            classPeriod: '1교시',
            timeRange: '09:00 ~ 10:00',
          },
        ],
      },
    ])

    expect(sessions?.[0]?.resolvedScheduleId).toBe(9876)
  })
})

describe('mapProgramSchedulesToPreferredScheduleBlocks', () => {
  it('uses program detail ACTIVE schedules even when application preferences are empty', () => {
    const blocks = mapProgramSchedulesToPreferredScheduleBlocks([
      {
        id: 2,
        sessionNo: 2,
        startAt: '2026-04-20T09:50:00+09:00',
        endAt: '2026-04-20T10:30:00+09:00',
        scheduleStatus: 'ACTIVE',
      },
      {
        id: 1,
        sessionNo: 1,
        startAt: '2026-04-20T09:00:00+09:00',
        endAt: '2026-04-20T09:40:00+09:00',
        scheduleStatus: 'ACTIVE',
      },
      {
        id: 3,
        sessionNo: 3,
        startAt: '2026-04-21T09:00:00+09:00',
        endAt: '2026-04-21T09:40:00+09:00',
        scheduleStatus: 'CANCELLED',
      },
    ])

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({
      date: '2026-04-20',
      dayOfWeek: '월',
      sessionCount: 2,
    })
    expect(blocks[0]?.sessionTimes.map(session => session.sessionIndex)).toEqual([1, 2])
  })
})

describe('mapApplicantSchoolToParticipatingSchool basic info', () => {
  it('진행 현황 상세 표에 상세 주소·교육 형태·신청 사유·기타 요청을 넘긴다', () => {
    const applicant = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691187,
        programId: 186010,
        schoolName: 'JA서울미래초등학교',
        addressDetail: '3층 교무실',
        applicationReason: '금융 교육',
        otherRequests: '주차',
        requestedEducationFormat: 'OFFLINE',
      },
      0,
      '186010'
    )
    const participating = mapApplicantSchoolToParticipatingSchool(applicant, 0)
    expect(participating.organizationApplicationId).toBe('1691187')
    const detail = getSchoolDetailByRow(participating)
    expect(detail.addressDetail).toBe('3층 교무실')
    expect(detail.educationFormat).toBe('오프라인')
    expect(detail.applicationReason).toBe('금융 교육')
    expect(detail.otherRequests).toBe('주차')
    expect(detail.teacherEmail).toBeUndefined()
  })

  it('목록 행의 교재명·교사 연락처를 상세 draft에 넣는다', () => {
    const detail = getSchoolDetailByRow({
      id: '1691187',
      no: 1,
      schoolName: '부산다온초등학교',
      region: '부산',
      educationGrade: '1학년',
      classCount: 1,
      studentCount: 24,
      lectureRound: '',
      textbookStatus: 'not_applicable',
      approvalStatus: 'approved',
      teacherName: '윤석영',
      contact: '010-****-1234',
      teacherEmail: 'yoon@school.kr',
      textbookName: '성공하는 경제생활',
      textbookId: '55',
      instructors: '',
    })
    expect(detail).toMatchObject({
      teacherName: '윤석영',
      teacherPhone: '010-****-1234',
      teacherMobile: '010-****-1234',
      teacherEmail: 'yoon@school.kr',
      textbookName: '성공하는 경제생활',
      textbookId: '55',
    })
  })
})

describe('mapPreferredScheduleBlocks', () => {
  it('preferredScheduleBlocks를 sessions로 투영해 진행 희망 교육 일정이 비지 않는다', () => {
    const applicant = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1691187,
        programId: 186010,
        schoolName: 'JA서울미래초등학교',
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-07-08',
            dayOfWeek: '수',
            sessionCount: 1,
            sessionTimes: [
              { sessionIndex: 1, classPeriod: '1교시', timeRange: '10:00 ~ 11:00' },
            ],
          },
        ],
      },
      0,
      '186010'
    )
    const participating = mapApplicantSchoolToParticipatingSchool(applicant, 0)
    expect(participating.sessions).toEqual([
      {
        round: 1,
        date: '2026.07.08',
        dayOfWeek: '수',
        duration: '1차시',
        format: '',
        classNum: '1교시',
        timeRange: '10:00~11:00',
        resolvedScheduleId: null,
      },
    ])
  })
})

describe('mapPreferredScheduleBlocks normalize', () => {
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
