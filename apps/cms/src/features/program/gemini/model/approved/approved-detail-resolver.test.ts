import { describe, expect, it } from 'vitest'
import type { GeminiApprovedTrainingDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingDetailResponse'
import {
  mapGeminiApprovedTrainingDetailResponseToDetail,
  mapGeminiInstructorApplicationItemToRow,
} from './approved-detail-resolver'

describe('mapGeminiApprovedTrainingDetailResponseToDetail', () => {
  it('maps P0 detail fields and keeps null counts/employment without defaults', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 185334,
      programId: 184900,
      organizationApplicationId: 185334,
      recruitmentTitle: '제미나이 아카데미 찾아가는 연수 모집',
      progressStatus: 'SCHEDULED',
      trainingDate: null,
      trainingTimeText: null,
      classCount: null,
      lastPreferredDate: '2026-03-15',
      studentCount: undefined,
      institutionApplicationCount: null,
      institutionCompletedTrainingCount: null,
      institutionJoinedAt: '2025-11-01',
      institutionName: '서울고',
      institutionSido: '서울특별시',
      institutionSigungu: '강남구',
      institutionAddress: null,
      teacherMemberId: 12001,
      teacherSchoolOrganizationId: 190100,
      teacherName: '김교사',
      teacherPhone: '010-1234-5678',
      teacherEmail: 'kim@example.com',
      teacherEmploymentStatus: null,
      teacherScheduleChangeCount: undefined,
      assignedInstructor: undefined,
      officialDocumentRequired: false,
    })

    expect(detail.id).toBe('185334')
    expect(detail.programId).toBe('184900')
    expect(detail.recruitmentTitle).toBe('제미나이 아카데미 찾아가는 연수 모집')
    expect(detail.trainingDate).toBe('')
    expect(detail.studentCount).toBeNull()
    expect(detail.recruitmentCount).toBeNull()
    expect(detail.completedRecruitmentCount).toBeNull()
    expect(detail.managerEmploymentStatus).toBeNull()
    expect(detail.managerScheduleChangeCount).toBe(0)
    expect(detail.managerNameKo).toBe('김교사')
    expect(detail.managerMemberId).toBe('12001')
    expect(detail.instructorAssigned).toBe(false)
    expect(detail.teacherSchoolOrganizationId).toBe(190100)
    expect(detail.officialDocumentRequired).toBe(false)
    expect(detail.officialDocumentRequiredInfo).toBeNull()
    expect(detail.progressStatus).toBe('SCHEDULED')
    expect(detail.lastPreferredDate).toBe('2026-03-15')
    expect(detail.managerPosition).toBe('')
    expect(detail.managerSubject).toBe('')
  })

  it('계좌번호 마스킹 문자열을 유지하고 직급·과목은 비운다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 186100,
      teacherPosition: null,
      teacherSubject: null,
      teacherScheduleChangeCount: 0,
      teacherAccountBank: '국민',
      teacherAccountNumber: '123-****-7890',
      teacherAccountHolder: '김교사',
      trainingDate: null,
      lastPreferredDate: '2026-03-15',
      classCount: null,
    })

    expect(detail.managerScheduleChangeCount).toBe(0)
    expect(detail.managerPosition).toBe('')
    expect(detail.managerSubject).toBe('')
    expect(detail.managerAccountBank).toBe('국민')
    expect(detail.managerAccountNumber).toBe('123-****-7890')
    expect(detail.managerAccountHolder).toBe('김교사')
    expect(detail.trainingDate).toBe('')
    expect(detail.classCount).toBeNull()
    expect(detail.trainingDate).not.toBe(detail.lastPreferredDate)
  })

  it('직급·과목은 상세 API 응답 값을 그대로 보존한다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 186102,
      teacherPosition: ' 과장 ',
      teacherSubject: '정보',
    })

    expect(detail.managerPosition).toBe(' 과장 ')
    expect(detail.managerSubject).toBe('정보')
  })

  it('계좌가 없으면 계좌번호만 빈 문자열로 둔다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 186101,
      teacherAccountBank: '국민',
      teacherAccountNumber: null,
      teacherAccountHolder: '김교사',
    })

    expect(detail.managerAccountBank).toBe('국민')
    expect(detail.managerAccountNumber).toBe('')
    expect(detail.managerAccountHolder).toBe('김교사')
  })

  it('trainingTimeText가 없으면 시작·종료 시각으로 대체하지 않는다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 1091531,
      organizationApplicationId: 1091531,
      institutionName: 'QA 제휴학교',
      scheduleId: 90001,
      assignedInstructor: null,
      trainingDate: '2026-01-30',
      trainingTimeText: null,
      trainingStartTime: '10:30',
      trainingEndTime: '13:00',
      classCount: 3,
    })

    expect(detail.instructorAssigned).toBe(false)
    expect(detail.trainingDate).toBe('2026-01-30')
    expect(detail.trainingTimeText).toBe('')
    expect(detail.classCount).toBe(3)
  })

  it('maps assignedInstructor when present', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 1,
      programId: 2,
      assignedInstructor: {
        memberId: 190001,
        name: '이강사',
        homeAddress: '부산 해운대',
        experienceYears: 3,
        grade: 'A등급',
        phone: '010-****-0000',
        email: 'lee***@example.com',
      },
      officialDocumentRequired: true,
      officialDocumentRequiredInfo: '학교장 직인',
    })
    expect(detail.instructorAssigned).toBe(true)
    expect(detail.instructor).toEqual({
      memberId: '190001',
      name: '이강사',
      region: '부산 해운대',
      experienceYears: 3,
      grade: 'A등급',
      contact: '010-****-0000',
      email: 'lee***@example.com',
    })
    expect(detail.officialDocumentRequired).toBe(true)
    expect(detail.officialDocumentRequiredInfo).toBe('학교장 직인')
  })

  it('일정 없이도 assignedInstructor만으로 담당 강사를 두고 희망일을 확정일로 쓰지 않는다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 185334,
      programId: 185003,
      instructorMemberId: 190006,
      instructorName: '최지원',
      trainingDate: null,
      trainingTimeText: null,
      lastPreferredDate: '2026-05-01',
      assignedInstructor: {
        memberId: 190006,
        name: '최지원',
        homeAddress: '부산광역시 해운대구 센텀중앙로 79',
        experienceYears: null,
        grade: null,
        phone: '010-3327-5124',
        email: 'jiwon94k@tinto.co.kr',
      },
    })

    expect(detail.instructorAssigned).toBe(true)
    expect(detail.trainingDate).toBe('')
    expect(detail.trainingDate).not.toBe(detail.lastPreferredDate)
    expect(detail.instructor).toEqual({
      memberId: '190006',
      name: '최지원',
      region: '부산광역시 해운대구 센텀중앙로 79',
      experienceYears: null,
      grade: '-',
      contact: '010-3327-5124',
      email: 'jiwon94k@tinto.co.kr',
    })
  })

  it('assignedInstructor가 null이면 instructorName이 있어도 섹션을 열지 않는다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 185334,
      instructorName: '최지원',
      trainingDate: null,
      lastPreferredDate: '2026-05-01',
      // OpenAPI는 optional만 적지만 응답은 null로 온다.
      assignedInstructor: null,
    } as unknown as GeminiApprovedTrainingDetailResponse)

    expect(detail.instructorAssigned).toBe(false)
    expect(detail.trainingDate).toBe('')
    expect(detail.instructor.name).toBe('-')
  })

  it('회원 ID가 없는 assignedInstructor는 부분 응답으로 보고 미배정 처리한다', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 185334,
      instructorMemberId: 190006,
      instructorName: '최지원',
      assignedInstructor: {
        name: '최지원',
        phone: '010-3327-5124',
      },
    })

    expect(detail.instructorAssigned).toBe(false)
    expect(detail.instructor.name).toBe('-')
  })

  it('maps QA seed 1691498 fields without inventing school org or official-doc copy', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 1691498,
      teacherMemberId: 190080,
      teacherSchoolOrganizationId: 190100,
      officialDocumentRequired: true,
      officialDocumentRequiredInfo: null,
      progressStatus: 'SCHEDULED',
      assignedInstructor: null,
      trainingDate: null,
      lastPreferredDate: '2026-05-01',
      teacherScheduleChangeCount: 0,
    } as unknown as GeminiApprovedTrainingDetailResponse)

    expect(detail.teacherSchoolOrganizationId).toBe(190100)
    expect(detail.managerMemberId).toBe('190080')
    expect(detail.officialDocumentRequired).toBe(true)
    expect(detail.officialDocumentRequiredInfo).toBeNull()
    expect(detail.progressStatus).toBe('SCHEDULED')
    expect(detail.instructorAssigned).toBe(false)
    expect(detail.trainingDate).toBe('')
    expect(detail.trainingDate).not.toBe(detail.lastPreferredDate)
    expect(detail.managerScheduleChangeCount).toBe(0)
  })

  it('keeps teacherSchoolOrganizationId null even when teacherMemberId is present', () => {
    const detail = mapGeminiApprovedTrainingDetailResponseToDetail({
      id: 1,
      teacherMemberId: 190080,
      teacherSchoolOrganizationId: null,
    } as unknown as GeminiApprovedTrainingDetailResponse)

    expect(detail.managerMemberId).toBe('190080')
    expect(detail.teacherSchoolOrganizationId).toBeNull()
  })
})

describe('mapGeminiInstructorApplicationItemToRow', () => {
  it('maps instructor application list columns', () => {
    const row = mapGeminiInstructorApplicationItemToRow(
      {
        applicationId: 190001,
        instructorName: '이강사',
        applicationStatus: 'PENDING',
        homeSido: '부산광역시',
        homeSigungu: '해운대구',
        experienceYears: 3,
        grade: 'A등급',
        phone: '010-****-0000',
        email: 'lee***@example.com',
        monthlyAssignmentCount: 1,
      },
      '185334',
      0
    )
    expect(row.id).toBe('190001')
    expect(row.approvedTrainingId).toBe('185334')
    expect(row.instructorName).toBe('이강사')
    expect(row.homeSido).toBe('부산광역시')
    expect(row.homeSigungu).toBe('해운대구')
    expect(row.approvalStatus).toBe('PENDING')
    expect(row.availableActions).toEqual([])
    expect(row.monthlyAssignmentCount).toBe(1)
    expect(row.grade).toBe('A등급')
  })

  it('maps GRADE_2 snapshot to 2급', () => {
    const row = mapGeminiInstructorApplicationItemToRow(
      {
        applicationId: 1,
        instructorName: '강사',
        instructorFeeGradeSnapshot: 'GRADE_2',
      },
      '1',
      0
    )
    expect(row.grade).toBe('2급')
  })

  it('preserves missing experience years as null instead of displaying 0년', () => {
    const row = mapGeminiInstructorApplicationItemToRow(
      {
        applicationId: 3,
        instructorName: '경력 미입력 강사',
        experienceYears: null,
      },
      '1',
      0
    )

    expect(row.experienceYears).toBeNull()
  })

  it.each(['AUTO_REJECTED', 'CANCELLED'])('maps %s to 신청 반려 상태', applicationStatus => {
    const row = mapGeminiInstructorApplicationItemToRow(
      {
        applicationId: 2,
        instructorName: '반려 강사',
        applicationStatus,
      },
      '1',
      0
    )

    expect(row.approvalStatus).toBe('REJECTED')
  })

  it('does not turn an unknown server status into pending', () => {
    const row = mapGeminiInstructorApplicationItemToRow(
      { applicationId: 3, applicationStatus: 'PROCESSING' },
      '1',
      0
    )

    expect(row.approvalStatus).toBe('UNKNOWN')
  })
})
