import { describe, expect, it } from 'vitest'
import {
  instructorApplicationListItemFixture,
  organizationApplicationListItemFixture,
  participantListItemFixture,
} from '@/shared/test/openapi-dashboard-fixtures'
import { asOpenApiFixture } from '@/shared/test/openapi-fixture-cast'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { IndividualApplicationListItemEnriched } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  filterIndividualDoc1Rows,
  mapApiApplicationStatusToApprovalStatus,
  mapApiInterviewStatusToAssignmentStatus,
  mapApiVolunteerInterviewStatusToAssignmentStatus,
  mapIndividualApplicationDetailToApplicantRow,
  mapIndividualApplicationToApplicantRow,
  mapIndividualApplicationToApprovalStatus,
  readIndividualApplicationListAffiliationDisplayName,
  readIndividualApplicationListGrade,
  mapInterviewEvaluationSlots,
  mapInstructorApplicationDetailToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapMaterialAssignmentStatusToTextbookStatus,
  mapTextbookDeliveryStatusToBadge,
  mapTextbookStatusKeyToDeliveryStatus,
  mapPreferredEducationSchedulesToSessions,
  resolveOrganizationApplicationHopeSessions,
  mapOrganizationApplicationDetailToApplicantSchoolRow,
  mapOrganizationApplicationListSessionsToConfirmedSessions,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
  mapVolunteerInterviewAssignmentFromWire,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'
import type { Program } from '@/types/domain'

describe('general-applications-adapters', () => {
  it('maps requested grade onto the applicant grade cell', () => {
    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 1691187,
        requestedGrade: '2',
        organizationAddressDetail: '3층 교무실',
        applicationReason: '금융 교육',
        otherRequests: '주차',
        requestedEducationFormat: 'ONLINE',
      },
      {
        id: '1691187',
        no: 1,
        schoolName: 'JA서울미래초등학교',
        region: '서울특별시 종로구',
        educationGrade: '',
        classCount: 2,
        studentCount: 111,
        teacherName: '교사',
        approvalStatus: 'pending',
        programId: '186010',
        detail: { addressDetail: '본관' },
      }
    )
    expect(row.educationGrade).toBe('2학년')
    expect(row.detail?.addressDetail).toBe('3층 교무실')
    expect(row.detail?.applicationReason).toBe('금융 교육')
    expect(row.detail?.otherRequests).toBe('주차')
    expect(row.detail?.educationType).toBe('온라인')
  })

  it('maps detail GET reason and guidance onto applicant school detail', () => {
    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 101,
        applicationReason: '기업가정신 교육',
        otherRequests: '빔프로젝터',
        computerInRoom: '노트북 2대',
        waitingRoomLocation: '교무실 앞',
        mealNotice: '급식 가능',
        parkingInfo: '정문 주차',
        requestedEducationFormat: 'OFFLINE',
      },
      {
        id: '101',
        no: 1,
        schoolName: 'JA서대문혁신초등학교',
        region: '서울',
        educationGrade: '2학년',
        classCount: 1,
        studentCount: 11,
        teacherName: '이교사',
        approvalStatus: 'pending',
        programId: '186016',
      }
    )
    expect(row.detail?.applicationReason).toBe('기업가정신 교육')
    expect(row.detail?.otherRequests).toBe('빔프로젝터')
    expect(row.detail?.computerInSpace).toBe('노트북 2대')
    expect(row.detail?.waitingPlaceGuide).toBe('교무실 앞')
    expect(row.detail?.mealInfo).toBe('급식 가능')
    expect(row.detail?.otherSpecialNotes).toBe('정문 주차')
    expect(row.detail?.educationType).toBe('오프라인')
  })

  it('keeps detail teacherTel and teacherPhone in their separate canonical fields', () => {
    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 103,
        teacherTel: '02-1234-5678',
        teacherPhone: '010-1111-2222',
      },
      {
        id: '103',
        no: 1,
        schoolName: '학교',
        region: '서울',
        educationGrade: '1학년',
        classCount: 1,
        studentCount: 10,
        teacherName: '교사',
        approvalStatus: 'approved',
        programId: '186101',
      }
    )

    expect(row.detail?.teacherTel).toBe('02-1234-5678')
    expect(row.detail?.teacherPhone).toBe('010-1111-2222')
  })

  it('keeps preferred hope sessions when detail dto.sessions has OSA or assigned rows', () => {
    const preferred = [
      { scheduleId: 180101, round: 1, startAt: '2026-10-10T01:00:00Z', endAt: '2026-10-10T03:00:00Z' },
      { scheduleId: 180102, round: 2, startAt: '2026-10-11T01:00:00Z', endAt: '2026-10-11T03:00:00Z' },
      { scheduleId: 180103, round: 3, startAt: '2026-10-12T01:00:00Z', endAt: '2026-10-12T03:00:00Z' },
      { scheduleId: 180104, round: 4, startAt: '2026-10-13T01:00:00Z', endAt: '2026-10-13T03:00:00Z' },
    ] as never[]
    const base = {
      id: '104',
      no: 1,
      schoolName: '학교',
      region: '서울',
      educationGrade: '1학년',
      classCount: 1,
      studentCount: 10,
      teacherName: '교사',
      approvalStatus: 'approved' as const,
      programId: '186101',
    }

    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 104,
        programType: 'GENERAL_ORGANIZATION',
        sessions: [
          {
            scheduleId: 180001,
            resolvedScheduleId: 180001,
            sessionNo: 1,
            scheduleName: 'OSA 배정',
            startAt: '2026-10-15T01:00:00Z',
            endAt: '2026-10-15T03:00:00Z',
          },
        ],
        preferredEducationSchedules: preferred,
      },
      base
    )

    expect(row.sessions).toHaveLength(4)
    expect(row.sessions?.map(s => s.resolvedScheduleId)).toEqual([180101, 180102, 180103, 180104])
  })

  it('isolates hope sessions per organization application (multi-institution)', () => {
    const preferredA = [
      { scheduleId: 1, round: 1, startAt: '2026-10-10T01:00:00Z', endAt: '2026-10-10T03:00:00Z' },
      { scheduleId: 2, round: 2, startAt: '2026-10-11T01:00:00Z', endAt: '2026-10-11T03:00:00Z' },
      { scheduleId: 3, round: 3, startAt: '2026-10-12T01:00:00Z', endAt: '2026-10-12T03:00:00Z' },
      { scheduleId: 4, round: 4, startAt: '2026-10-13T01:00:00Z', endAt: '2026-10-13T03:00:00Z' },
    ] as never[]
    const preferredB = [
      { scheduleId: 21, round: 1, startAt: '2026-10-20T01:00:00Z', endAt: '2026-10-20T03:00:00Z' },
      { scheduleId: 22, round: 2, startAt: '2026-10-21T01:00:00Z', endAt: '2026-10-21T03:00:00Z' },
    ] as never[]

    const rowA = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1001,
        programType: 'GENERAL_ORGANIZATION',
        organizationName: '기관 A',
        applicationStatus: 'APPROVED',
        preferredEducationSchedules: preferredA,
        sessions: [{ scheduleId: 999, roundNumber: 1, startAt: '2026-10-15T01:00:00Z' }],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186903'
    )
    const rowB = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1002,
        programType: 'GENERAL_ORGANIZATION',
        organizationName: '기관 B',
        applicationStatus: 'APPROVED',
        preferredEducationSchedules: preferredB,
        sessions: [],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      1,
      '186903'
    )

    expect(rowA.sessions).toHaveLength(4)
    expect(rowB.sessions).toHaveLength(2)
    expect(rowA.sessions?.[0]?.resolvedScheduleId).toBe(1)
    expect(rowB.sessions?.[0]?.resolvedScheduleId).toBe(21)
  })

  it('does not restore omitted detail fields from the list row', () => {
    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 102,
        applicationStatus: 'APPROVED',
      },
      {
        id: '102',
        no: 1,
        schoolName: '목록 기관명',
        region: '목록 지역',
        educationGrade: '3학년',
        classCount: 2,
        studentCount: 30,
        teacherName: '목록 담당자',
        contact: '목록 전화번호',
        approvalStatus: 'approved',
        programId: '186101',
        sessions: [{ date: '2026-10-15', dayOfWeek: '목' } as never],
        preferredEducationSchedules: [
          {
            preferenceRank: 1,
            date: '2026-10-15',
            dayOfWeek: '목',
            sessionCount: 1,
            sessionTimes: [],
          } as never,
        ],
        detail: {
          educationType: '온라인',
          applicationReason: '기존 사유',
          teacherPhone: '기존 전화번호',
        },
      }
    )

    expect(row.schoolName).toBe('-')
    expect(row.region).toBe('-')
    expect(row.educationGrade).toBe('-')
    expect(row.teacherName).toBe('-')
    expect(row.contact).toBeUndefined()
    expect(row.sessions).toHaveLength(1)
    expect(row.sessions?.[0]?.date).toBe('2026-10-15')
    expect(row.preferredEducationSchedules).toHaveLength(1)
    expect(row.detail?.educationType).toBeUndefined()
    expect(row.detail?.applicationReason).toBeUndefined()
    expect(row.detail?.teacherPhone).toBeUndefined()
  })

  it('maps company-school economy fields from organization list and detail GET', () => {
    const listRow = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 202,
        organizationName: 'JA서울미래초등학교',
        previousYearParticipation: 'yes',
        affiliatedFinancialCompany: 'KB국민은행',
      } as unknown as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '170001'
    )
    expect(listRow.detail?.previousYearParticipation).toBe('참여')
    expect(listRow.detail?.affiliatedFinancialCompany).toBe('KB국민은행')

    const detailRow = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 202,
        previousYearParticipation: '미참여',
        affiliatedFinancialCompany: '신한은행',
      } as Parameters<typeof mapOrganizationApplicationDetailToApplicantSchoolRow>[0],
      {
        id: '202',
        no: 1,
        schoolName: 'JA서울미래초등학교',
        region: '서울',
        educationGrade: '2학년',
        classCount: 1,
        studentCount: 20,
        teacherName: '김교사',
        approvalStatus: 'pending',
        programId: '170001',
        detail: { previousYearParticipation: '참여' },
      }
    )
    expect(detailRow.detail?.previousYearParticipation).toBe('미참여')
    expect(detailRow.detail?.affiliatedFinancialCompany).toBe('신한은행')
  })

  it('does not show the program grade range when the application has no requested grade', () => {
    const row = mapOrganizationApplicationDetailToApplicantSchoolRow(
      { requestedEducationFormat: 'HYBRID' },
      {
        id: '1',
        no: 1,
        schoolName: '학교',
        region: '서울',
        educationGrade: '3~6학년',
        classCount: 1,
        studentCount: 10,
        teacherName: '교사',
        approvalStatus: 'pending',
        programId: '186010',
      }
    )
    expect(row.educationGrade).toBe('-')
    expect(row.detail?.educationType).toBe('온/오프라인')
  })

  it('maps API application status to approval status', () => {
    expect(mapApiApplicationStatusToApprovalStatus('APPROVED')).toBe('approved')
    expect(mapApiApplicationStatusToApprovalStatus('WAITING_REVIEW')).toBe('pending')
    expect(mapApiApplicationStatusToApprovalStatus('REJECTED')).toBe('rejected')
    expect(mapApiApplicationStatusToApprovalStatus('CANCELLED')).toBe('cancelled')
    expect(mapApiApplicationStatusToApprovalStatus('REJECTION_CANCELLED')).toBe('pending')
  })

  it('maps interview-track individual approval from document/final result when applicationStatus stays waiting', () => {
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'WAITING_REVIEW',
        documentStatus: 'PASS',
      })
    ).toBe('approved')
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'DOCUMENT_PASSED',
      })
    ).toBe('approved')
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'WAITING_REVIEW',
        finalResultStatus: 'PASS',
      })
    ).toBe('approved')
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'WAITING_REVIEW',
        finalResultStatus: 'FAIL',
      })
    ).toBe('rejected')
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'CANCELLED',
        documentStatus: 'PASS',
      })
    ).toBe('cancelled')
    expect(
      mapIndividualApplicationToApprovalStatus({
        applicationStatus: 'WAITING_REVIEW',
      })
    ).toBe('pending')
  })

  it('maps interview-track individual list rows to program approval from document result', () => {
    const row = mapIndividualApplicationToApplicantRow(
      {
        id: 56,
        programId: 5001,
        memberName: '서류합격자',
        applicationStatus: 'WAITING_REVIEW',
        documentStatus: 'PASS',
        finalResultStatus: 'WAITING',
      } as never,
      0,
      '5001'
    )
    expect(row.approvalStatus).toBe('approved')
  })

  it('maps organization application list item to applicant row', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      organizationApplicationListItemFixture({
        id: 101,
        organizationId: 8801,
        teacherMemberId: 9901,
        organizationName: '서울초',
        teacherName: '김교사',
        requestedClassCount: 2,
        requestedStudentCount: 40,
        applicationStatus: 'WAITING_REVIEW',
        submittedAt: '2026-04-01T00:00:00Z',
        availableActions: ['VIEW'],
        sessions: [],
      }),
      0,
      '5001'
    )

    expect(row.id).toBe('101')
    expect(row.organizationId).toBe(8801)
    expect(row.teacherMemberId).toBe(9901)
    expect(row.schoolName).toBe('서울초')
    expect(row.approvalStatus).toBe('pending')
    expect(row.programId).toBe('5001')
    expect(row.availableActions).toEqual(['VIEW'])
  })

  it('maps organization resultNotificationSentAt and RESEND_NOTIFICATION', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      organizationApplicationListItemFixture({
        id: 1691123,
        organizationName: '승인학교',
        applicationStatus: 'APPROVED',
        resultNotificationSentAt: '2026-09-27T05:00:00Z',
        availableActions: ['VIEW', 'RESEND_NOTIFICATION', 'CANCEL_APPROVAL'],
        sessions: [],
      }),
      0,
      '168001'
    )

    expect(row.approvalStatus).toBe('approved')
    expect(row.availableActions).toContain('RESEND_NOTIFICATION')
    expect(row.approvalNotificationSentAt).toMatch(/2026\.\d{2}\.\d{2}/)
  })

  it('uses requested schedules when preferred rows have no calendar date', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691207,
        programType: 'GENERAL_ORGANIZATION',
        organizationName: '서울공항초등학교',
        applicationStatus: 'SUBMITTED',
        preferredEducationSchedules: [
          { scheduleId: null, round: 1, startAt: null, endAt: null, label: null },
        ],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186091',
      {
        requestedSchedules: [
          {
            id: 9001,
            preferenceOrder: 1,
            requestedDate: '2026-10-26',
            startPeriod: null,
            sessionCount: 1,
            combinedClassYn: false,
            sessionTimes: [{ sessionOrder: 1, startTime: '13:30:00', endTime: '15:30:00' }],
            resolvedScheduleId: undefined,
          },
        ],
      }
    )

    expect(row.sessions).toHaveLength(1)
    expect(row.sessions?.[0]?.date).toBe('2026.10.26')
  })

  it('maps organization preferredEducationSchedules (B) to assignment sessions', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691206,
        programType: 'GENERAL_ORGANIZATION',
        organizationName: '서울공항초',
        applicationStatus: 'APPROVED',
        preferredEducationSchedules: [
          {
            scheduleId: 801,
            round: 1,
            startAt: '2026-10-26T01:00:00Z',
            endAt: '2026-10-26T03:00:00Z',
            label: null,
          },
          {
            scheduleId: null,
            round: 2,
            startAt: null,
            endAt: null,
            label: '2026.11.02(월) 13:30 ~ 16:00',
          },
        ],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186084'
    )

    expect(row.preferredEducationSchedules).toHaveLength(2)
    expect(row.sessions).toHaveLength(2)
    expect(row.sessions?.[0]?.resolvedScheduleId).toBe(801)
    expect(row.sessions?.[0]?.status).toBe('pending')
    expect(row.sessions?.[1]?.scheduleUnresolved).toBe(true)
    expect(row.sessions?.[1]?.scheduleLabel).toBe('2026.11.02(월) 13:30 ~ 16:00')
  })

  it('maps materialized line:N preferred schedules with scheduleId and startAt', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691207,
        programType: 'GENERAL_ORGANIZATION',
        organizationName: '서울공항초',
        applicationStatus: 'APPROVED',
        preferredEducationSchedules: [
          {
            scheduleId: 902,
            round: 1,
            startAt: '2026-11-02T04:30:00Z',
            endAt: '2026-11-02T07:00:00Z',
            label: '2026.11.02(월) 13:30 ~ 16:00',
          },
        ],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186084'
    )

    expect(row.sessions).toHaveLength(1)
    expect(row.sessions?.[0]?.resolvedScheduleId).toBe(902)
    expect(row.sessions?.[0]?.scheduleUnresolved).toBeUndefined()
    expect(row.sessions?.[0]?.scheduleLabel).toBe('2026.11.02(월) 13:30 ~ 16:00')
    expect(row.sessions?.[0]?.timeRange).toContain('~')
  })

  it('uses educationDate (Seoul calendar) instead of UTC-sliced startAt', () => {
    const sessions = mapPreferredEducationSchedulesToSessions([
      {
        startAt: '2026-11-01T15:30:00.000Z',
        endAt: '2026-11-01T16:00:00.000Z',
        educationDate: '2026-11-02',
      },
    ])
    expect(sessions[0]?.date).toBe('2026.11.02')
  })

  it('does not render 00:00 for a date-only preferred schedule', () => {
    const sessions = mapPreferredEducationSchedulesToSessions([
      {
        label: '2026.11.02(월)',
        startAt: '2026-11-02T00:00:00+09:00',
        endAt: '2026-11-02T00:00:00+09:00',
      },
    ])
    expect(sessions[0]?.timeRange).toBe('-')
    expect(sessions[0]?.duration).toBe('-')
    expect(sessions[0]?.scheduleLabel).toBe('2026.11.02(월)')
  })

  it('maps ORGANIZATION participant give-up fields to participating school row', () => {
    const active = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1691423,
        memberName: '테스트초',
        teacherMemberId: 9901,
        participantStatus: 'APPROVED',
        availableActions: ['VIEW', 'GIVE_UP'],
      } as never,
      0,
      '168001'
    )
    expect(active.id).toBe('1691423')
    expect(active.teacherMemberId).toBe(9901)
    expect(active.activityWithdrawn).toBe(false)
    expect(active.availableActions).toEqual(['VIEW', 'GIVE_UP'])

    const withdrawn = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1691424,
        organizationName: '포기초',
        participantStatus: 'GIVE_UP',
        giveUpAt: '2026-09-01T00:00:00Z',
        availableActions: ['VIEW'],
      } as never,
      1,
      '168002'
    )
    expect(withdrawn.schoolName).toBe('포기초')
    expect(withdrawn.activityWithdrawn).toBe(true)
    expect(withdrawn.giveUpAt).toBe('2026-09-01T00:00:00Z')
    expect(withdrawn.availableActions).toEqual(['VIEW'])
  })

  it('maps ORGANIZATION participant list fields used by 참여 기관 정보 조회', () => {
    const row = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1691425,
        organizationApplicationId: 77001,
        organizationName: '진월초',
        grade: '5',
        regionSido: '광주광역시',
        regionSigungu: '남구',
        classCount: 2,
        studentCount: 48,
        teacherName: '김담당',
        phone: '010-1111-2222',
        email: 'teacher@school.kr',
        textbookId: 12,
        textbookName: '금융교육 5학년',
        materialAssignmentStatus: 'ASSIGNED',
        textbookDeliveryStatus: 'SHIPPING',
        sessions: [
          {
            scheduleId: 801,
            sessionNo: 1,
            scheduleName: '1회차',
            startAt: '2026-10-12T09:00:00+09:00',
            endAt: '2026-10-12T11:00:00+09:00',
          },
        ],
        availableActions: ['VIEW', 'GIVE_UP'],
      } as never,
      0,
      '168001'
    )

    expect(row.organizationApplicationId).toBe('77001')
    expect(row.educationGrade).toBe('5학년')
    expect(row.region).toBe('광주광역시 남구')
    expect(row.classCount).toBe(2)
    expect(row.studentCount).toBe(48)
    expect(row.teacherName).toBe('김담당')
    expect(row.teacherPhone).toBe('010-1111-2222')
    expect(row.teacherEmail).toBe('teacher@school.kr')
    expect(row.textbookId).toBe('12')
    expect(row.textbookName).toBe('금융교육 5학년')
    expect(row.textbookStatus).toBe('shipping')
    expect(row.sessions).toHaveLength(1)
    expect(row.sessions?.[0]?.resolvedScheduleId).toBe(801)
  })

  it('maps unresolved requested schedule sessions for 참여 기관 목록', () => {
    const row = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1694743,
        organizationApplicationId: 1691206,
        organizationName: '서울공항초등학교',
        grade: '2',
        sessions: [
          {
            scheduleId: null,
            requestedScheduleId: 184833,
            resolvedScheduleId: null,
            scheduleUnresolved: true,
            sessionNo: 1,
            scheduleName: '26년 10월 26일(월) 10:00 ~ 12:00',
            startAt: '2026-10-26T01:00:00Z',
            endAt: '2026-10-26T03:00:00Z',
            attendanceStatus: null,
            assignmentStatus: null,
          },
        ],
      } as never,
      0,
      '186084'
    )

    expect(row.educationGrade).toBe('2학년')
    expect(row.sessions).toHaveLength(1)
    expect(row.sessions?.[0]?.scheduleUnresolved).toBe(true)
    expect(row.sessions?.[0]?.resolvedScheduleId).toBeNull()
    expect(row.sessions?.[0]?.requestedScheduleId).toBe(184833)
    expect(row.sessions?.[0]?.timeRange).toContain('~')
  })

  it('maps participant preferredEducationSchedules when sessions are empty', () => {
    const row = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1695027,
        organizationApplicationId: 1691546,
        sourceApplicationId: 1691546,
        organizationName: 'QA 제휴학교',
        grade: '2',
        sessions: [],
        preferredEducationSchedules: [
          {
            scheduleId: null,
            round: 1,
            startAt: '2026-12-22T18:00:00Z',
            endAt: '2026-12-22T21:00:00Z',
            label: null,
            unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
            educationDate: '2026-12-23',
          },
          {
            scheduleId: null,
            round: 2,
            startAt: '2026-12-29T19:00:00Z',
            endAt: '2026-12-29T22:00:00Z',
            label: null,
            unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
            educationDate: '2026-12-30',
          },
        ],
      } as never,
      0,
      '186473'
    )
    expect(row.sessions).toBeUndefined()
    expect(row.preferredEducationSchedules).toHaveLength(2)
    expect(row.hopeEducationSessions).toHaveLength(2)
    expect(row.hopeEducationSessions?.[0]?.date).toBe('2026.12.23')
    expect(row.hopeEducationSessions?.[0]?.timeRange).toBe('03:00 ~ 06:00')
    expect(row.hopeEducationSessions?.[1]?.date).toBe('2026.12.30')
  })

  it.each([
    ['BEFORE_SHIPPING', 'preparing'],
    ['SHIPPING', 'shipping'],
    ['DELIVERED', 'delivered'],
    ['NOT_APPLICABLE', 'not_applicable'],
    [undefined, 'not_applicable'],
  ] as const)('maps material assignment status %s to %s', (status, expected) => {
    expect(mapMaterialAssignmentStatusToTextbookStatus(status)).toBe(expected)
  })

  it.each([
    ['PREPARING', 'preparing'],
    ['SHIPPING', 'shipping'],
    ['DELIVERED', 'delivered'],
    ['NOT_APPLICABLE', 'not_applicable'],
  ] as const)('maps textbook delivery status %s to badge %s', (status, expected) => {
    expect(mapTextbookDeliveryStatusToBadge(status)).toBe(expected)
  })

  it('prefers textbookDeliveryStatus over materialAssignmentStatus for the badge', () => {
    const row = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 31001,
        materialAssignmentStatus: 'ASSIGNED',
        textbookDeliveryStatus: 'PREPARING',
      } as never,
      0,
      '168001'
    )
    expect(row.textbookStatus).toBe('preparing')
    expect(mapTextbookStatusKeyToDeliveryStatus('delivered')).toBe('DELIVERED')
  })

  it('maps saved affiliation fallback for individual, instructor, and volunteer participants', () => {
    const dto = participantListItemFixture({
      participantId: 1691500,
      memberName: '기존 회원',
      organizationId: 8801,
      organizationName: '기존 소속 기관',
    })

    const individual = mapParticipantToParticipatingIndividualRow(dto, 0, '168001')
    const instructor = mapParticipantToParticipatingInstructorRow(dto, 0, '168001')
    const volunteer = mapParticipantToParticipatingVolunteerRow(dto, 0, '168001')

    expect(individual.affiliationOrganizationId).toBe(8801)
    expect(individual.affiliation).toBe('기존 소속 기관')
    expect(instructor.affiliationOrganizationId).toBe(8801)
    expect(instructor.affiliation).toBe('기존 소속 기관')
    expect(volunteer.affiliationOrganizationId).toBe(8801)
    expect(volunteer.affiliation).toBe('기존 소속 기관')
    expect(volunteer.assignedInstitutionNames).toEqual(['기존 소속 기관'])
  })

  it('maps individual sourceApplicationId to individualApplicationId and keeps participantId as id', () => {
    const individual = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 1691701,
        memberId: 9102,
        memberName: '김참여자',
        sourceApplicationId: 88001,
        organizationName: '강서고등학교',
        grade: '고등학교 2학년',
        regionSido: '서울특별시',
        regionSigungu: '강서구',
        sessions: [
          {
            scheduleId: 601,
            sessionNo: 1,
            scheduleName: '1회차',
            startAt: '2026-10-12T09:00:00+09:00',
            endAt: '2026-10-12T11:00:00+09:00',
            scheduleStatus: 'COMPLETED',
            attendanceStatus: 'COMPLETED',
          },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168001'
    )

    expect(individual.id).toBe('1691701')
    expect(individual.individualApplicationId).toBe('88001')
    expect(individual.memberId).toBe('9102')
    expect(individual.affiliation).toBe('강서고등학교')
    expect(individual.educationGrade).toBe('고등학교 2학년')
    expect(individual.homeAddress).toBe('서울특별시 강서구')
    expect(individual.sessions).toHaveLength(1)
    expect(individual.sessions?.[0]?.resolvedScheduleId).toBe(601)
    expect(individual.sessions?.[0]?.status).toBe('completed')
    expect(individual.sessions?.[0]?.deliveryScheduleStatus).toBe('COMPLETED')
    expect(individual.lectureAttendanceSessions).toEqual([])
    expect(individual.satisfactionSurveyCompleted).toBe(false)
  })

  it('maps INDIVIDUAL list sessions as returned without filling empty with program catalog', () => {
    const scoped = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 892031,
        memberName: '배정일부',
        participantType: 'INDIVIDUAL',
        sessions: [
          {
            scheduleId: 892011,
            resolvedScheduleId: 892011,
            sessionNo: 1,
            startAt: '2026-10-01T01:00:00Z',
            endAt: '2026-10-01T03:00:00Z',
          },
          {
            scheduleId: 892013,
            resolvedScheduleId: 892013,
            sessionNo: 3,
            startAt: '2026-10-15T01:00:00Z',
            endAt: '2026-10-15T03:00:00Z',
          },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '186089'
    )
    expect(scoped.sessions?.map(row => row.resolvedScheduleId)).toEqual([892011, 892013])

    const empty = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 892032,
        memberName: '미배정',
        participantType: 'INDIVIDUAL',
        sessions: [],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '186089'
    )
    expect(empty.sessions).toEqual([])
  })

  it('derives session education progress from scheduleStatus only', () => {
    const individual = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 1694745,
        memberName: '일반회원2',
        sessions: [
          {
            scheduleId: 9001,
            sessionNo: 1,
            scheduleStatus: 'SCHEDULED',
            attendanceStatus: 'COMPLETED',
            startAt: '2026-10-15T00:00:00+09:00',
            endAt: '2026-10-15T23:59:00+09:00',
          },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '186089'
    )

    expect(individual.sessions?.[0]?.status).toBe('pending')
    expect(individual.sessions?.[0]?.deliveryScheduleStatus).toBe('SCHEDULED')
  })

  it('maps individual person attendance onto lectureAttendanceSessions', () => {
    const individual = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 1691703,
        memberName: '이참여자',
        sessions: [
          { scheduleId: 701, sessionNo: 1, attendanceStatus: 'PRESENT' },
          { scheduleId: 702, sessionNo: 2, attendanceStatus: 'LATE' },
          { scheduleId: 703, sessionNo: 3, attendanceStatus: 'EXCUSED' },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168001'
    )

    expect(individual.lectureAttendanceSessions).toEqual([
      { roundNumber: 1, scheduleId: 701, status: 'attended' },
      { roundNumber: 2, scheduleId: 702, status: 'late' },
      { roundNumber: 3, scheduleId: 703, status: 'attended' },
    ])
  })

  it('prefers homeAddressSummary and maps satisfactionSurveyCompleted when present', () => {
    const individual = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 1691702,
        memberName: '박참여자',
        homeAddressSummary: '경기도 성남시 분당구',
        regionSido: '서울특별시',
        regionSigungu: '강서구',
        contact: '010-****-1111',
        email: 'p***@example.com',
        satisfactionSurveyCompleted: true,
      } as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse & {
        satisfactionSurveyCompleted?: boolean
      },
      0,
      '168001'
    )

    expect(individual.homeAddress).toBe('경기도 성남시 분당구')
    expect(individual.satisfactionSurveyCompleted).toBe(true)
    expect(individual.detail?.contact).toBe('010-****-1111')
    expect(individual.detail?.email).toBe('p***@example.com')
  })

  it('maps list birthDate and gender into detail for certificate issuance', () => {
    const withProfile = mapParticipantToParticipatingIndividualRow(
      participantListItemFixture({
        participantId: 1694731,
        memberName: '이건희일반',
        birthDate: '1994-07-29',
        gender: 'MALE',
      }),
      0,
      '186046'
    )
    const legacyGender = mapParticipantToParticipatingIndividualRow(
      participantListItemFixture({
        participantId: 1694732,
        memberName: '레거시',
        birthDate: null,
        gender: 'X',
      }),
      1,
      '186046'
    )

    expect(withProfile.detail?.birthDate).toBe('1994-07-29')
    expect(withProfile.detail?.gender).toBe('남성')
    expect(legacyGender.detail?.birthDate).toBeUndefined()
    expect(legacyGender.detail?.gender).toBe('X')
  })

  it('hides participating individual grade unless affiliation is a K-12 school', () => {
    const university = mapParticipantToParticipatingIndividualRow(
      participantListItemFixture({
        participantId: 1691801,
        memberName: '대학생',
        organizationName: '한국대학교',
        grade: '2학년',
      }),
      0,
      '168001'
    )
    const unattached = mapParticipantToParticipatingIndividualRow(
      participantListItemFixture({
        participantId: 1691802,
        memberName: '미소속',
        grade: '고등학교 2학년',
      }),
      1,
      '168001'
    )

    expect(university.educationGrade).toBe('')
    expect(unattached.educationGrade).toBe('')
  })

  it('maps additive survey view keys when present', () => {
    const individual = mapParticipantToParticipatingIndividualRow(
      {
        participantId: 1691704,
        memberName: '최참여자',
        surveyResponse: { templateVersionId: 12, formResponseId: 3401 },
        satisfactionResponse: { templateVersionId: 15, formResponseId: 3402 },
      } as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse & {
        surveyResponse?: { templateVersionId: number; formResponseId: number }
        satisfactionResponse?: { templateVersionId: number; formResponseId: number }
      },
      0,
      '168001'
    )

    expect(individual.surveyResponse).toEqual({ templateVersionId: 12, formResponseId: 3401 })
    expect(individual.satisfactionResponse).toEqual({
      templateVersionId: 15,
      formResponseId: 3402,
    })
  })

  it('maps volunteer participant sessions and additive enrich fields', () => {
    const volunteer = mapParticipantToParticipatingVolunteerRow(
      {
        participantId: 1691601,
        memberId: 9101,
        sourceApplicationId: 77002,
        memberName: '이봉사자',
        organizationName: '해봄초등학교',
        id1365: '1365-10001',
        contact: '010-****-9999',
        email: 'vol***@example.com',
        volunteerKind: 'GENERAL',
        birthDate: '1999-03-04',
        assignedOrganizationNames: ['해봄초등학교', '푸른초등학교'],
        sessions: [
          {
            scheduleId: 501,
            sessionNo: 1,
            scheduleName: '1회차',
            startAt: '2026-10-12T09:00:00+09:00',
            endAt: '2026-10-12T11:00:00+09:00',
            scheduleStatus: 'COMPLETED',
            attendanceStatus: 'COMPLETED',
          },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168001'
    )

    expect(volunteer.id).toBe('1691601')
    expect(volunteer.volunteerApplicationId).toBe('77002')
    expect(volunteer.volunteerKind).toBe('GENERAL')
    expect(volunteer.birthDate).toBe('1999-03-04')
    expect(volunteer.memberId).toBe(9101)
    expect(volunteer.id1365).toBe('1365-10001')
    expect(volunteer.assignedInstitutionNames).toEqual(['해봄초등학교', '푸른초등학교'])
    expect(volunteer.contact).toBe('010-****-9999')
    expect(volunteer.email).toBe('vol***@example.com')
    expect(volunteer.sessions).toHaveLength(1)
    expect(volunteer.sessions[0]?.resolvedScheduleId).toBe(501)
    expect(volunteer.sessions[0]?.status).toBe('completed')
  })

  it('maps instructor participant enrich fields for progress instructor list', () => {
    const instructor = mapParticipantToParticipatingInstructorRow(
      {
        participantId: 1691501,
        memberId: 9001,
        memberName: '김강사',
        regionSido: '서울특별시',
        regionSigungu: '강서구',
        homeAddressSummary: '서울특별시 강서구',
        contact: '010-****-1234',
        email: 'kim***@example.com',
        jaEvaluationGrade: 'A',
        lectureExperienceYears: 4,
        settlementStatus: 'awaiting_confirmation',
        assignedOrganizationNames: ['해봄초등학교', '푸른초등학교'],
        lectureReportSubmitted: true,
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168006'
    )

    expect(instructor.address).toBe('서울특별시 강서구')
    expect(instructor.contact).toBe('010-****-1234')
    expect(instructor.email).toBe('kim***@example.com')
    expect(instructor.jaEvaluationGrade).toBe('A')
    expect(instructor.lectureExperienceYears).toBe(4)
    expect(instructor.settlementStatus).toBe('awaiting_confirmation')
    expect(instructor.assignedOrganizationNames).toEqual(['해봄초등학교', '푸른초등학교'])
    expect(instructor.schoolName).toBe('해봄초등학교')
    expect(instructor.lectureReportSubmitted).toBe(true)
    expect(instructor.instructorApplicationId).toBeUndefined()
    expect(instructor.memberId).toBe('9001')
  })

  it('maps admin-registered instructor row with null sourceApplicationId and none settlement', () => {
    const instructor = mapParticipantToParticipatingInstructorRow(
      {
        participantId: 1,
        memberId: 190010,
        memberName: '등록강사',
        sourceApplicationId: null,
        settlementStatus: 'none',
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '170002'
    )

    expect(instructor.id).toBe('1')
    expect(instructor.memberId).toBe('190010')
    expect(instructor.instructorApplicationId).toBeUndefined()
    expect(instructor.settlementStatus).toBe('none')
  })

  it('maps instructor sourceApplicationId to instructorApplicationId', () => {
    const instructor = mapParticipantToParticipatingInstructorRow(
      {
        participantId: 1691502,
        memberName: '박강사',
        sourceApplicationId: 77001,
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168006'
    )

    expect(instructor.instructorApplicationId).toBe('77001')
  })

  it('maps participant sessions to educationSchedules for activity withdraw', () => {
    const instructor = mapParticipantToParticipatingInstructorRow(
      {
        participantId: 1691503,
        memberName: '일정강사',
        sessions: [
          { scheduleId: 501, sessionNo: 1, scheduleName: '1차 교육', startAt: '2026-05-01T09:00:00' },
          { scheduleId: 502, sessionNo: 2, scheduleName: '2차 교육', startAt: '2026-05-08T09:00:00' },
        ],
      } as unknown as import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse,
      0,
      '168006'
    )

    expect(instructor.educationSchedules).toHaveLength(2)
    expect(instructor.educationSchedules?.[0]?.id).toBe('501')
    expect(instructor.educationSchedules?.[0]?.scheduleLabel).toContain('1차')
  })

  it('does not invent affiliationOrganizationId from display name alone', () => {
    const row = mapIndividualApplicationToApplicantRow(
      {
        id: 56,
        programId: 5001,
        memberName: '이름만있는참여자',
        affiliationName: '서울초등학교',
        applicationStatus: 'WAITING_REVIEW',
      } as never,
      0,
      '5001'
    )

    expect(row.affiliationOrganizationId).toBeUndefined()
    expect(row.affiliation).toBe('서울초등학교')
  })

  it('keeps affiliation empty when BE has no affiliationName', () => {
    const row = mapIndividualApplicationToApplicantRow(
      {
        id: 57,
        programId: 5001,
        memberName: '소속없는참여자',
        affiliationName: '',
        affiliationOrganizationId: null,
        applicationStatus: 'WAITING_REVIEW',
      } as never,
      0,
      '5001'
    )

    expect(row.affiliation).toBe('')
  })

  it('maps instructor application list item to applicant row', () => {
    const row = mapInstructorApplicationToApplicantInstructorRow(
      instructorApplicationListItemFixture({
        id: 77,
        instructorMemberId: 9001,
        affiliationOrganizationId: 8801,
        programId: 5001,
        instructorName: '이강사',
        applicationStatus: 'APPROVED',
        instructorFeeGradeSnapshot: '3급 강사비',
        submittedAt: '2026-04-02T00:00:00Z',
        rejectReason: '서류 미비',
        preferredOrganizations: [],
        availableActions: [],
        availableScheduleIds: [],
      }),
      0,
      '5001'
    )

    expect(row.id).toBe('77')
    expect(row.instructorMemberId).toBe(9001)
    expect(row.affiliationOrganizationId).toBe(8801)
    expect(row.programId).toBe('5001')
    expect(row.instructorName).toBe('이강사')
    expect(row.approvalStatus).toBe('approved')
    expect(row.instructorFeeGradeLabel).toBe('3급 강사비')
    expect(row.rejectionReason).toBe('서류 미비')
  })

  it('maps instructor preferredOrganizations to preferredSchools for calendar', () => {
    const row = mapInstructorApplicationToApplicantInstructorRow(
      instructorApplicationListItemFixture({
        id: 88,
        programId: 5001,
        instructorName: '김강사',
        applicationStatus: 'SUBMITTED',
        preferredOrganizations: [
          {
            preferenceOrder: 1,
            organizationName: '테스트초',
            educationGrade: '4학년',
            dateRangeLabel: '2026.06.01(월) ~ 2026.06.02(화)',
          },
        ],
        availableActions: [],
        availableScheduleIds: [],
      }),
      0,
      '5001'
    )

    expect(row.schoolName).toBe('테스트초')
    expect(row.preferredSchools).toHaveLength(1)
    expect(row.preferredSchools?.[0]?.dateRange).toContain('2026.06.01')
  })

  it('fills affiliation and settlement from instructorCmsProfile and settlement on detail', () => {
    const base = mapInstructorApplicationToApplicantInstructorRow(
      instructorApplicationListItemFixture({
        id: 1,
        instructorMemberId: 9001,
        programId: 186081,
        instructorName: '이강사',
        applicationStatus: 'SUBMITTED',
        preferredOrganizations: [],
        availableActions: [],
        availableScheduleIds: [],
      }),
      0,
      '186081'
    )
    const row = mapInstructorApplicationDetailToApplicantRow(
      {
        id: 1,
        instructorCmsProfile: {
          affiliation: {
            organizationNames: ['JA Korea 본부'],
          },
        },
        settlement: {
          bankName: '국민은행',
          accountNumber: '123-456-7890',
          accountHolder: '이강사',
          businessIncome: false,
        },
      } as never,
      base
    )
    expect(row.affiliation).toBe('JA Korea 본부')
    expect(row.bankName).toBe('국민은행')
    expect(row.accountNumber).toBe('123-456-7890')
    expect(row.businessIncomeEarnerStatus).toBe('해당 없음')
  })

  it('merges instructorCmsProfile resume onto instructor application detail', () => {
    const base = mapInstructorApplicationToApplicantInstructorRow(
      instructorApplicationListItemFixture({
        id: 1694639,
        instructorMemberId: 190001,
        programId: 186048,
        instructorName: '이건희',
        applicationStatus: 'SUBMITTED',
        preferredOrganizations: [],
        availableActions: [],
        availableScheduleIds: [],
      }),
      0,
      '186048'
    )
    const instructorCmsProfile = {
      memberType: 'GENERAL',
      career: {
        level: 'experienced',
        rows: [
          {
            companyName: 'JA Korea',
            roleName: '강사',
            periodStart: '2020-01',
            currentlyEmployed: true,
          },
        ],
      },
      awards: [{ title: '우수강사상', acquiredYear: '2024' }],
      essays: { freeWrite1: '자기소개', freeWrite4: '대처사례' },
    }

    const row = mapInstructorApplicationDetailToApplicantRow(
      asOpenApiFixture<InstructorApplicationDetailResponse>({
        id: 1694639,
        instructorCmsProfile,
      }),
      { ...base, freeWriting2: '기존 작성' }
    )

    expect(row.careerDetails).toHaveLength(1)
    expect(row.awards).toHaveLength(1)
    expect(row.freeWriting1).toBe('자기소개')
    expect(row.freeWriting2).toBe('기존 작성')
    expect(row.freeWriting4).toBe('대처사례')
    expect(row.instructorCareerLevel).toBe('experienced')
  })

  it('keeps base resume when instructorCmsProfile is absent', () => {
    const base = mapInstructorApplicationToApplicantInstructorRow(
      asOpenApiFixture<InstructorApplicationListItemResponse>({
        id: 1,
        programId: 1,
        instructorName: '강사',
        applicationStatus: 'SUBMITTED',
        preferredOrganizations: [],
        availableScheduleIds: [],
        availableActions: [],
      }),
      0,
      '1'
    )
    const row = mapInstructorApplicationDetailToApplicantRow(
      asOpenApiFixture<InstructorApplicationDetailResponse>({ id: 1 }),
      { ...base, freeWriting1: '기존' }
    )
    expect(row.freeWriting1).toBe('기존')
  })

  it('maps volunteer application list item to screening row', () => {
    const row = mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      asOpenApiFixture<VolunteerApplicationListItemResponse>({
        id: 55,
        programId: 5001,
        affiliationOrganizationId: undefined,
        memberName: '김봉사',
        documentStatus: 'PASS',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: 'RESERVE',
        reserveRank: 2,
        isReparticipation: true,
        giveUpYn: false,
        managerAEvaluation: 'NEUTRAL',
        managerBEvaluation: 'UNREVIEWED',
        canEditManagerAEvaluation: true,
        canEditManagerBEvaluation: false,
        availableActions: ['VIEW', 'UPDATE_DOCUMENT_EVALUATION'],
      }),
      0,
      '5001'
    )

    expect(row.id).toBe('55')
    expect(row.affiliationOrganizationId).toBeUndefined()
    expect(row.name).toBe('김봉사')
    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('assigned')
    expect(row.secondInterviewScreeningStatus).toBe('reserve2')
    expect(row.applicationType).toBe('ujat-graduate')
    expect(row.managerAEvaluation).toBe('neutral')
    expect(row.managerBEvaluation).toBe('unreviewed')
    expect(row.canEditManagerAEvaluation).toBe(true)
    expect(row.canEditManagerBEvaluation).toBe(false)
    expect(row.availableActions).toEqual(['VIEW', 'UPDATE_DOCUMENT_EVALUATION'])
    expect(row.essayIntro).toBe('')
    expect(row.homeAddress).toBe('')
  })

  it('maps volunteer list homeAddressSummary when present', () => {
    const row = mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      {
        id: 57,
        programId: 5001,
        memberName: '김봉사',
        homeAddressSummary: ' 서울특별시 ',
      } as Parameters<typeof mapVolunteerApplicationToGeneralVolunteerApplicantRow>[0],
      0,
      '5001'
    )
    expect(row.homeAddress).toBe('서울특별시')
  })

  it('maps volunteer list essay fields and keeps null as empty', () => {
    const row = mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      {
        id: 56,
        programId: 5001,
        memberName: '김봉사',
        essayIntro: ' 자기소개 ',
        essayEducationExperience: '****2312',
        essayNecessity: null,
        essayJaExperience: 'JA 경험',
      } as Parameters<typeof mapVolunteerApplicationToGeneralVolunteerApplicantRow>[0],
      0,
      '5001'
    )

    expect(row.essayIntro).toBe('자기소개')
    expect(row.essayEducationExperience).toBe('****2312')
    expect(row.essayNecessity).toBe('')
    expect(row.essayJaExperience).toBe('JA 경험')
  })

  it('reads list grade and affiliation from BE snapshot fallback keys', () => {
    const dto = {
      applicationGrade: '',
      affiliationName: '',
      affiliationSchool: '오리엔테이션 초등학교',
      requestedGrade: '3',
    } as Parameters<typeof mapIndividualApplicationToApplicantRow>[0]

    expect(readIndividualApplicationListGrade(dto)).toBe('3학년')
    expect(readIndividualApplicationListAffiliationDisplayName(dto)).toBe('오리엔테이션 초등학교')

    const row = mapIndividualApplicationToApplicantRow(dto, 0, '5001')
    expect(row.educationGrade).toBe('3학년')
    expect(row.affiliation).toBe('오리엔테이션 초등학교')
  })

  it('hides list grade when affiliation is not an elementary, middle, or high school', () => {
    expect(
      readIndividualApplicationListGrade({
        affiliationName: '한국대학교',
        applicationGrade: '2학년',
      } as Parameters<typeof mapIndividualApplicationToApplicantRow>[0])
    ).toBe('')
    expect(
      readIndividualApplicationListGrade({
        affiliationName: 'JA강사단',
        applicationGrade: '3학년',
      } as Parameters<typeof mapIndividualApplicationToApplicantRow>[0])
    ).toBe('')
  })

  it('keeps list affiliation and grade when detail profile fields are empty', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1,
        profile: { name: '김*자' },
      } as never,
      {
        id: '1',
        no: 1,
        applicantName: '김참여',
        affiliation: '목록 소속 초등학교',
        educationGrade: '4학년',
        homeAddress: '서울특별시 강서구',
        approvalStatus: 'pending',
      }
    )

    expect(row.applicantName).toBe('김*자')
    expect(row.affiliation).toBe('목록 소속 초등학교')
    expect(row.educationGrade).toBe('4학년')
    expect(row.homeAddress).toBe('서울특별시 강서구')
  })

  it('keeps list availableActions when detail omits the field', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 3,
        applicationStatus: 'REJECTED',
        profile: { name: '김반려' },
      } as never,
      {
        id: '3',
        no: 1,
        applicantName: '김반려',
        affiliation: '',
        educationGrade: '',
        homeAddress: '',
        approvalStatus: 'rejected',
        availableActions: ['VIEW', 'CANCEL_REJECTION'],
      }
    )

    expect(row.approvalStatus).toBe('rejected')
    expect(row.availableActions).toEqual(['VIEW', 'CANCEL_REJECTION'])
  })

  it('clears detail grade when affiliation is not a K-12 school', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 2,
        profile: { name: '대학생', affiliationSchool: '한국대학교', affiliationGrade: '2학년' },
      } as never,
      {
        id: '2',
        no: 1,
        applicantName: '대학생',
        affiliation: '한국대학교',
        educationGrade: '2학년',
        homeAddress: '',
        approvalStatus: 'pending',
      }
    )

    expect(row.educationGrade).toBe('')
  })

  it('maps individual application list item with screening fields', () => {
    const row = mapIndividualApplicationToApplicantRow(
      asOpenApiFixture<IndividualApplicationListItemEnriched>({
        id: 55,
        programId: 5001,
        affiliationOrganizationId: 8802,
        memberName: '김참여자',
        affiliationName: '한국대학교',
        applicationGrade: '2학년',
        homeAddressSummary: '서울특별시 강남구',
        managerComment: '신청 정보 재확인 필요',
        preferredEducationSchedules: [
          {
            scheduleId: 168362,
            round: 2,
            startAt: '2026-09-22T01:00:00Z',
            endAt: '2026-09-22T03:00:00Z',
          },
        ],
        applicationStatus: 'WAITING_REVIEW',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: 'RESERVE',
        reserveRank: 2,
        giveUpYn: false,
        managerAEvaluation: 'UNREVIEWED',
        managerBEvaluation: 'PASS',
        availableActions: ['VIEW', 'COMMENT_UPDATE', 'RESEND_NOTIFICATION'],
        submittedAt: '2026-04-03T00:00:00Z',
        assignedInterviewSlotId: 1001,
        assignedInterviewStartAt: '2026-04-10T10:00:00+09:00',
        assignedInterviewEndAt: '2026-04-10T11:00:00+09:00',
        interviewAvailabilityCount: 3,
        interviewAvailabilitySlots: [
          {
            startAt: '2026-09-18T01:00:00Z',
            endAt: '2026-09-18T02:00:00Z',
          },
          {
            startAt: '2026-09-18T05:00:00Z',
            endAt: '2026-09-18T06:00:00Z',
          },
          {
            startAt: '2026-09-20T01:00:00Z',
            endAt: '2026-09-20T02:00:00Z',
          },
        ],
      }),
      0,
      '5001'
    )

    expect(row.id).toBe('55')
    expect(row.affiliationOrganizationId).toBe(8802)
    expect(row.applicantName).toBe('김참여자')
    expect(row.affiliation).toBe('한국대학교')
    expect(row.educationGrade).toBe('')
    expect(row.homeAddress).toBe('서울특별시 강남구')
    expect(row.adminComment).toBe('신청 정보 재확인 필요')
    expect(row.sessions).toEqual([
      expect.objectContaining({
        round: 2,
        date: '2026.09.22',
        timeRange: '10:00 ~ 12:00',
        resolvedScheduleId: 168362,
      }),
    ])
    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('assigned')
    expect(row.secondInterviewScreeningStatus).toBe('reserve2')
    expect(row.programId).toBe('5001')
    expect(row.availableActions).toEqual(['VIEW', 'COMMENT_UPDATE', 'RESEND_NOTIFICATION'])
    expect(row.managerAEvaluation).toBe('unreviewed')
    expect(row.managerBEvaluation).toBe('pass')
    expect(row.assignedInterviewDateLabel).toBe('2026.04.10')
    expect(row.assignedInterviewTime).toContain('10:00')
    expect(row.interviewSlotCount).toBe(3)
    expect(row.detail?.interviewAvailability).toEqual([
      {
        dateLabel: '2026.09.18(금)',
        slots: ['10:00 ~ 11:00', '14:00 ~ 15:00'],
      },
      {
        dateLabel: '2026.09.20(일)',
        slots: ['10:00 ~ 11:00'],
      },
    ])
  })

  it('shows line schedule labels and keeps them after operational schedules', () => {
    const row = mapIndividualApplicationToApplicantRow(
      asOpenApiFixture<IndividualApplicationListItemEnriched>({
        id: 56,
        programId: 186021,
        memberName: '이참여자',
        preferredEducationSchedules: [
          { label: '26년 10월 20일(화) 13:30 ~ 16:00' },
          {
            scheduleId: 186597,
            round: 1,
            startAt: '2026-10-04T01:00:00Z',
            endAt: '2026-10-04T02:00:00Z',
          },
          { label: '26년 10월 13일(화) 10:00 ~ 12:00' },
        ],
        applicationStatus: 'WAITING_REVIEW',
      }),
      0,
      '186021'
    )

    expect(row.sessions?.map(session => session.scheduleLabel ?? session.timeRange)).toEqual([
      '10:00 ~ 11:00',
      '26년 10월 20일(화) 13:30 ~ 16:00',
      '26년 10월 13일(화) 10:00 ~ 12:00',
    ])
    expect(row.sessions?.[0]?.scheduleLabel).toBeUndefined()
    expect(row.sessions?.[1]?.date).toBe('-')
    expect(row.sessions?.[1]?.timeRange).toBe('-')
  })

  it('keeps reviewed applications in the first document screening list', () => {
    const rows = [
      { id: '1', documentScreeningStatus: 'pending' },
      { id: '2', documentScreeningStatus: 'fail' },
      { id: '3', documentScreeningStatus: 'pass' },
    ] as ReturnType<typeof mapIndividualApplicationToApplicantRow>[]

    expect(filterIndividualDoc1Rows(rows)).toEqual(rows)
  })

  it('maps masked individual detail without member-based fallback', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1690625,
        programId: 168006,
        memberId: 190016,
        applicationStatus: 'APPROVED',
        managerComment: '상세 코멘트',
        availableActions: ['VIEW', 'RESEND_NOTIFICATION'],
        canEditManagerAEvaluation: true,
        canEditManagerBEvaluation: false,
        privacyMaskingLevel: 'MASKED',
        canRevealPersonalInfo: true,
        profile: {
          name: '김*자',
          affiliationSchool: 'Case6 QA school 5',
          affiliationGrade: '대학교 2학년',
          contact: '010-****-1234',
        },
        application: {
          selfIntroduction: '신청 시점 자기소개',
          preferredEducationSchedules: [{ scheduleId: 168362, round: 1 }],
          scheduleChangeCancelCount: 2,
        },
        textbook: {
          id: 168036,
          name: '개인 프로그램 교재',
          kits: 3,
          quantity: 3,
          status: 'PREPARING',
        },
        team: {
          name: '우리가 최고',
          memberCount: 3,
          role: 'LEADER',
        } as never,
        screening: {
          documentStatus: 'PASS',
          documentEvaluations: {
            managerA: { evaluation: 'PASS' } as never,
            managerB: { evaluation: 'NEUTRAL' } as never,
          },
          interviewEvaluations: [
            { evaluatorOrder: 1, score: 42 },
            { evaluatorOrder: 2, score: 45 },
          ],
          interviewTotalScore: 87,
          interviewEvaluationRemark: '면접 평가',
          finalResultStatus: 'PASS',
          giveUpYn: false,
        },
        interviewAvailabilitySlots: [
          {
            startAt: '2026-09-18T01:00:00Z',
            endAt: '2026-09-18T02:00:00Z',
          },
        ],
        interviewAvailabilityCount: 1,
        assignedInterviewSlotId: 1690961,
        assignedInterviewStartAt: '2026-09-18T01:00:00Z',
        assignedInterviewEndAt: '2026-09-18T02:00:00Z',
      } as any,
      {
        id: '1690625',
        no: 1,
        applicantName: '목록 이름',
        affiliation: '목록 소속',
        educationGrade: '목록 학년',
        homeAddress: '목록 주소',
        approvalStatus: 'pending',
      }
    )

    expect(row.memberId).toBe('190016')
    expect(row.applicantName).toBe('김*자')
    expect(row.privacyMaskingLevel).toBe('MASKED')
    expect(row.canRevealPersonalInfo).toBe(true)
    expect(row.managerAEvaluation).toBe('pass')
    expect(row.managerBEvaluation).toBe('neutral')
    expect(row.managerAScore).toBe(42)
    expect(row.managerBScore).toBe(45)
    expect(row.totalScore).toBe(87)
    expect(row.detail?.selfIntroduction).toBe('신청 시점 자기소개')
    expect(row.detail?.scheduleChangeCancelCount).toBe(2)
    expect(row.textbookId).toBe('168036')
    expect(row.detail?.teamName).toBe('우리가 최고')
    expect(row.detail?.teamMemberCount).toBe(3)
    expect(row.detail?.teamRole).toBe('leader')
    expect(row.interviewSlotCount).toBe(1)
    expect(row.assignedInterviewDateLabel).toBe('2026.09.18')
  })

  it('maps applicationNameChangeCount separately from scheduleChangeCancelCount', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1694745,
        application: {
          scheduleChangeCancelCount: 1,
          applicationNameChangeCount: 2,
        },
      } as any,
      {
        id: '1694745',
        no: 1,
        applicantName: '일반회원2',
        affiliation: '',
        educationGrade: '',
        homeAddress: '',
        approvalStatus: 'approved',
      } as import('@/features/program/general/model/individual-applicant').GeneralIndividualApplicantRow
    )

    expect(row.detail?.scheduleChangeCancelCount).toBe(1)
    expect(row.detail?.applicationNameChangeCount).toBe(2)
  })

  it('maps team info from API team.name projection (BE resolveTeam)', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1694634,
        team: { name: '신청 팀', memberCount: 4, role: 'MEMBER' },
      } as never,
      {
        id: '1694634',
        no: 1,
        applicantName: '테스트',
        affiliation: '',
        educationGrade: '',
        homeAddress: '',
        approvalStatus: 'pending',
      }
    )

    expect(row.detail?.teamName).toBe('신청 팀')
    expect(row.detail?.teamMemberCount).toBe(4)
    expect(row.detail?.teamRole).toBe('member')
  })

  it('maps team info from application formAnswers when API team is empty', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1694634,
        application: {
          formAnswers: {
            'program-participant-application-seed-team-info': {
              teamName: '신청서 팀',
              memberCountSelect: '4',
              teamRole: 'member',
            },
          },
        },
      } as never,
      {
        id: '1694634',
        no: 1,
        applicantName: '테스트',
        affiliation: '',
        educationGrade: '',
        homeAddress: '',
        approvalStatus: 'pending',
      }
    )

    expect(row.detail?.teamName).toBe('신청서 팀')
    expect(row.detail?.teamMemberCount).toBe(4)
    expect(row.detail?.teamMemberCountSelect).toBe('4')
    expect(row.detail?.teamRole).toBe('member')
  })

  it('maps GET assignment wire: INTERVIEW_ASSIGNED / ASSIGNED / PARTIALLY_EVALUATED', () => {
    expect(
      mapVolunteerInterviewAssignmentFromWire({
        applicationStatus: 'INTERVIEW_ASSIGNED',
        interviewStatus: 'ASSIGNED',
        interviewAssignmentStatus: 'ASSIGNED',
      })
    ).toBe('assigned')
    expect(
      mapVolunteerInterviewAssignmentFromWire({
        applicationStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'PARTIALLY_EVALUATED',
        interviewAssignmentStatus: 'PARTIALLY_EVALUATED',
      })
    ).toBe('assigned')
    expect(
      mapVolunteerInterviewAssignmentFromWire({
        applicationStatus: 'DOCUMENT_PASSED',
        interviewStatus: undefined,
        interviewAssignmentStatus: null,
      })
    ).toBe('waiting')
  })

  it('keeps evaluated interviews in the assigned state so they stay on the 2nd interview list', () => {
    for (const status of ['PARTIALLY_EVALUATED', 'EVALUATED', 'INTERVIEW_ASSIGNED']) {
      expect(mapApiVolunteerInterviewStatusToAssignmentStatus(status)).toBe('assigned')
      expect(mapApiInterviewStatusToAssignmentStatus(status)).toBe('assigned')
    }
    expect(mapApiVolunteerInterviewStatusToAssignmentStatus('EVALUATED', true)).toBe('withdrawn')
  })

  it('maps interview evaluation slots by evaluatorOrder, not array position', () => {
    expect(
      mapInterviewEvaluationSlots([
        { evaluatorOrder: 2, evaluatorAdminId: 20, scoreTotal: 4 },
        { evaluatorOrder: 1, evaluatorAdminId: 10, scoreTotal: 5 },
      ])
    ).toEqual({
      managerAScore: 5,
      managerBScore: 4,
      managerAEvaluatorAdminId: 10,
      managerBEvaluatorAdminId: 20,
    })
    expect(mapInterviewEvaluationSlots([{ evaluatorOrder: null, scoreTotal: 3 }])).toEqual({
      managerAScore: null,
      managerBScore: null,
      managerAEvaluatorAdminId: null,
      managerBEvaluatorAdminId: null,
    })
  })

  it('uses the document-evaluation action when slot edit flags are omitted', () => {
    const base = {
      id: '1690625',
      no: 1,
      applicantName: '목록 이름',
      affiliation: '목록 소속',
      educationGrade: '목록 학년',
      homeAddress: '목록 주소',
      approvalStatus: 'pending',
    } as const
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1690625,
        programId: 168006,
        applicationStatus: 'PENDING',
        availableActions: ['VIEW', 'UPDATE_DOCUMENT_EVALUATION'],
      },
      base
    )

    expect(row.canEditManagerAEvaluation).toBe(true)
    expect(row.canEditManagerBEvaluation).toBe(true)
  })
})

describe('general-program-service-detail-json', () => {
  it('round-trips CMS-only nested fields including education structure', () => {
    const program = {
      generalCommonInfo: { educationScheduleMode: 'period' as const },
      generalParticipantTypes: ['individual' as const],
      targetLevels: ['elementary' as const],
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
      generalProgramAudience: 'organization' as const,
    } as Program

    const raw = serializeGeneralProgramServiceDetailJson(program)
    expect(raw).toBeTruthy()

    const parsed = parseGeneralProgramServiceDetailJson(raw)
    expect(parsed.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(parsed.generalParticipantTypes).toEqual(['individual'])
    expect(parsed.targetLevels).toEqual(['elementary'])
    expect(parsed.generalProgramEducationStructure).toBe('curriculum')
    expect(parsed.generalProgramSessionRound).toBe('single')
    expect(parsed.generalProgramAudience).toBe('organization')
  })
})

describe('mapOrganizationApplicationListSessionsToConfirmedSessions', () => {
  it('maps CONFIRMED list sessions with scheduleId and startAt', () => {
    const sessions = mapOrganizationApplicationListSessionsToConfirmedSessions([
      {
        scheduleId: 42,
        roundNumber: 2,
        startAt: '2026-01-07T09:20:00+09:00',
        status: 'CONFIRMED',
      },
      {
        scheduleId: 43,
        startAt: '2026-01-08T10:00:00+09:00',
        status: 'CANCELLED',
      },
    ])
    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.resolvedScheduleId).toBe(42)
    expect(sessions[0]?.round).toBe(2)
    expect(sessions[0]?.date).toMatch(/2026\.01\.07/)
  })

  it('sets confirmedListAssignmentSessions on organization list rows', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1,
        organizationName: '동탄초등학교',
        regionSido: '경기도',
        regionSigungu: '화성시',
        sessions: [
          {
            scheduleId: 10,
            roundNumber: 1,
            startAt: '2026-01-07T09:00:00+09:00',
            status: 'TEMP_ASSIGNED',
          },
        ],
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      'prog-1'
    )
    expect(row.confirmedListAssignmentSessions).toHaveLength(1)
    expect(row.confirmedListAssignmentSessions?.[0]?.resolvedScheduleId).toBe(10)
  })

  it('maps list sessions with assignmentStatus (no status field) to confirmed sessions', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 2,
        organizationName: '부명초등학교',
        sessions: [
          {
            scheduleId: 186907,
            sessionNo: 5,
            startAt: '2026-11-12T15:00:00Z',
            assignmentStatus: 'TEMP_ASSIGNED',
          },
        ],
      } as unknown as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      'prog-1'
    )
    expect(row.confirmedListAssignmentSessions).toHaveLength(1)
    expect(row.confirmedListAssignmentSessions?.[0]?.resolvedScheduleId).toBe(186907)
    expect(row.confirmedListAssignmentSessions?.[0]?.round).toBe(5)
    expect(row.confirmedListAssignmentSessions?.[0]?.sessionNo).toBe(5)
  })

  it('keeps sessionNo/endAt raw and does not invent sessionNo when missing', () => {
    const sessions = mapOrganizationApplicationListSessionsToConfirmedSessions([
      {
        scheduleId: 7,
        sessionNo: 3,
        startAt: '2026-10-27T09:00:00+09:00',
        endAt: '2026-10-27T09:40:00+09:00',
        assignmentStatus: 'CONFIRMED',
      },
      {
        scheduleId: 8,
        startAt: '2026-10-28T09:00:00+09:00',
        assignmentStatus: 'TEMP_ASSIGNED',
      },
      {
        scheduleId: 9,
        sessionNo: 1,
        startAt: '2026-10-29T09:00:00+09:00',
        assignmentStatus: 'CANCELLED',
      },
    ] as Parameters<typeof mapOrganizationApplicationListSessionsToConfirmedSessions>[0])
    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.sessionNo).toBe(3)
    expect(sessions[0]?.endAt).toBe('2026-10-27T09:40:00+09:00')
    expect(sessions[1]?.sessionNo).toBeNull()
  })

  const preferred1691544 = [
    {
      scheduleId: null,
      round: 1,
      startAt: '2026-12-14T00:00:00Z',
      endAt: '2026-12-14T00:45:00Z',
      label: null,
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
    {
      scheduleId: null,
      round: 2,
      startAt: '2026-12-15T04:00:00Z',
      endAt: '2026-12-15T04:45:00Z',
      label: null,
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
  ]
  const preferred1691545 = [
    {
      scheduleId: null,
      round: 1,
      startAt: '2026-12-21T18:00:00Z',
      endAt: '2026-12-21T20:00:00Z',
      label: null,
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
    {
      scheduleId: null,
      round: 2,
      startAt: '2026-12-29T19:04:00Z',
      endAt: '2026-12-30T00:00:00Z',
      label: null,
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
  ]

  it('maps COMPANY_SCHOOL preferred hope sessions when requested is missing', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691544,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 A',
        applicationStatus: 'WAITING_REVIEW',
        preferredEducationSchedules: preferred1691544,
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186473'
    )
    expect(row.sessions).toHaveLength(2)
    expect(row.sessions?.[0]).toMatchObject({
      classNum: '1지망',
      date: '2026.12.14',
      dayOfWeek: '월',
      timeRange: '09:00 ~ 09:45',
      resolvedScheduleId: null,
      scheduleUnresolved: true,
    })
    expect(row.sessions?.[1]).toMatchObject({
      classNum: '2지망',
      date: '2026.12.15',
      dayOfWeek: '화',
      timeRange: '13:00 ~ 13:45',
    })
  })

  it('prefers requested schedules over preferred for COMPANY_SCHOOL', () => {
    const requested = [
      {
        id: 1,
        preferenceOrder: 1,
        requestedDate: '2026-11-01',
        startPeriod: null,
        sessionCount: 1,
        sessionTimes: [{ sessionOrder: 1, startTime: '10:00:00', endTime: '11:00:00' }],
      },
      {
        id: 2,
        preferenceOrder: 2,
        requestedDate: '2026-11-02',
        startPeriod: null,
        sessionCount: 1,
        sessionTimes: [{ sessionOrder: 1, startTime: '14:00:00', endTime: '15:00:00' }],
      },
    ]
    const sessions = resolveOrganizationApplicationHopeSessions(
      {
        programType: 'COMPANY_SCHOOL',
        availableActions: [],
        sessions: [],
        preferredEducationSchedules: [],
      },
      preferred1691544 as never,
      requested as never
    )
    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.date).toBe('2026.11.01')
    expect(sessions[0]?.timeRange).toBe('10:00 ~ 11:00')
    expect(sessions[1]?.date).toBe('2026.11.02')
  })

  it('falls back to preferred when COMPANY_SCHOOL requested is an empty array', () => {
    const sessions = resolveOrganizationApplicationHopeSessions(
      {
        programType: 'ONE_COMPANY_ONE_SCHOOL',
        availableActions: [],
        sessions: [],
        preferredEducationSchedules: [],
      },
      preferred1691545 as never,
      []
    )
    expect(sessions).toHaveLength(2)
    expect(sessions[0]).toMatchObject({
      date: '2026.12.22',
      dayOfWeek: '화',
      timeRange: '03:00 ~ 05:00',
    })
    expect(sessions[1]).toMatchObject({
      date: '2026.12.30',
      dayOfWeek: '수',
      timeRange: '04:04 ~ 09:00',
    })
  })

  it('keeps list preferred hope sessions when detail GET omits preferred', () => {
    const listRow = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691544,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 A',
        applicationStatus: 'WAITING_REVIEW',
        preferredEducationSchedules: preferred1691544,
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186473'
    )
    const detailRow = mapOrganizationApplicationDetailToApplicantSchoolRow(
      {
        id: 1691544,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 A',
        applicationStatus: 'WAITING_REVIEW',
      } as Parameters<typeof mapOrganizationApplicationDetailToApplicantSchoolRow>[0],
      listRow
    )
    expect(detailRow.preferredEducationSchedules).toHaveLength(2)
    expect(detailRow.sessions).toHaveLength(2)
    expect(detailRow.sessions?.[0]?.timeRange).toBe('09:00 ~ 09:45')
    expect(detailRow.sessions?.[1]?.timeRange).toBe('13:00 ~ 13:45')
  })

  it('does not mix hope sessions between COMPANY_SCHOOL applications', () => {
    const rowA = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691544,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 A',
        preferredEducationSchedules: preferred1691544,
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186473'
    )
    const rowB = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691545,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 B',
        preferredEducationSchedules: preferred1691545,
      } as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      1,
      '186473'
    )
    expect(rowA.id).toBe('1691544')
    expect(rowB.id).toBe('1691545')
    expect(rowA.sessions?.[0]?.timeRange).toBe('09:00 ~ 09:45')
    expect(rowB.sessions?.[0]?.timeRange).toBe('03:00 ~ 05:00')
    expect(rowA.sessions?.map(s => s.timeRange)).not.toEqual(rowB.sessions?.map(s => s.timeRange))
  })

  it('keeps unmatched preferred hope sessions out of confirmed assignment sessions', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 1691544,
        programType: 'COMPANY_SCHOOL',
        organizationName: '기관 A',
        preferredEducationSchedules: preferred1691544,
        sessions: [
          {
            scheduleId: 188001,
            sessionNo: 1,
            startAt: '2026-01-05T00:00:00Z',
            assignmentStatus: 'CONFIRMED',
          },
        ],
      } as unknown as Parameters<typeof mapOrganizationApplicationToApplicantSchoolRow>[0],
      0,
      '186473'
    )
    expect(row.sessions?.[0]?.date).toBe('2026.12.14')
    expect(row.sessions?.[0]?.resolvedScheduleId).toBeNull()
    expect(row.confirmedListAssignmentSessions).toHaveLength(1)
    expect(row.confirmedListAssignmentSessions?.[0]?.resolvedScheduleId).toBe(188001)
    expect(row.confirmedListAssignmentSessions?.[0]?.date).toBe('2026.01.05')
  })

  it('maps unmatched preferred rows with null label and scheduleId as visible hope sessions', () => {
    const sessions = mapPreferredEducationSchedulesToSessions(preferred1691544 as never)
    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.scheduleLabel).toBeUndefined()
    expect(sessions[0]?.resolvedScheduleId).toBeNull()
    expect(sessions[0]?.timeRange).toBe('09:00 ~ 09:45')
  })
})
