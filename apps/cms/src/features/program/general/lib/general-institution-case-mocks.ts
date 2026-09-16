import type {
  ApplicantApprovalStatusKey,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type {
  ParticipatingSchoolApprovalStatusKey,
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
  TextbookStatusKey,
} from '@/features/program/general/model/participating-schools'
import {
  buildGeneralInstitutionCaseId,
  GENERAL_INSTITUTION_CASE_PROGRAM_IDS,
  GENERAL_INSTITUTION_MEMBER_ROSTER,
  GENERAL_INSTITUTION_ORGANIZATION_ROSTER,
  isGeneralInstitutionCaseProgramId,
  type GeneralInstitutionCaseProgramId,
} from '@/features/program/general/lib/general-institution-case-roster'

const applicationStatuses: ApplicantApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
]

const participatingApprovalStatuses: ParticipatingSchoolApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
  'cancelled',
]

const textbookStatuses: TextbookStatusKey[] = [
  'preparing',
  'shipping',
  'delivered',
  'not_applicable',
]

function cloneRows<T>(rows: readonly T[]): T[] {
  return JSON.parse(JSON.stringify(rows)) as T[]
}

function buildSession(index: number): ParticipatingSchoolSession {
  const statuses = ['pending', 'completed', 'not_planned'] as const
  return {
    round: index + 1,
    date: `2026.10.${String(10 + index).padStart(2, '0')}`,
    dayOfWeek: ['토', '일', '월', '화'][index] ?? '월',
    duration: '2시간',
    format: index % 2 === 0 ? '오프라인' : '온라인',
    classNum: `${index + 1}차시`,
    timeRange: `${9 + index}:00~${11 + index}:00`,
    status: statuses[index % statuses.length],
    requestedScheduleId: 171700 + index,
    resolvedScheduleId: 171800 + index,
    scheduleUnresolved: false,
  }
}

function buildInstitutionApplicationRows(
  programId: GeneralInstitutionCaseProgramId
): ApplicantSchoolRow[] {
  const teacher = GENERAL_INSTITUTION_MEMBER_ROSTER.schoolTeacher
  return applicationStatuses.map((approvalStatus, index) => {
    const organization = GENERAL_INSTITUTION_ORGANIZATION_ROSTER[index]
    const session = buildSession(index)
    return {
      id: buildGeneralInstitutionCaseId(programId, 'organization-application', approvalStatus),
      organizationId: organization.organizationId,
      teacherMemberId: teacher.memberId,
      no: applicationStatuses.length - index,
      schoolName: organization.name,
      region: organization.address,
      desiredEducationPeriod: '2026.10.10~2026.10.31',
      educationGrade: `${index + 4}학년`,
      classCount: index + 2,
      studentCount: 48 + index * 12,
      teacherName: teacher.name,
      contact: teacher.contact,
      appliedAt: `2026.09.${String(10 + index).padStart(2, '0')}`,
      approvalStatus,
      scheduleChangeCancelCount: index + 1,
      programId,
      sessions: [session],
      assignedInstructorNames:
        approvalStatus === 'approved'
          ? GENERAL_INSTITUTION_MEMBER_ROSTER.instructor.name
          : '배정 전',
      detail: {
        addressDetail: organization.address,
        educationLocation: `${organization.name} 교육실`,
        educationType: '오프라인 경제교육',
        textbookName: 'JA 경제교육 표준 교재',
        totalHoursAndSessions: '총 2시간 | 1회',
        previousYearParticipation: '2025년 참여',
        affiliatedFinancialCompany: 'JA Korea 협력 금융사',
        teacherInfo: `${teacher.name} | ${teacher.contact} | ${teacher.email}`,
        applicationReason: '학생의 경제·금융 기초 역량 향상을 위해 신청합니다.',
        otherRequests: '수업 전 교재와 준비물 안내를 요청합니다.',
        computerInSpace: '노트북 20대 및 빔프로젝터 사용 가능',
        waitingRoom: '교무실 옆 회의실',
        parkingInfo: '교내 방문자 주차장 이용 가능',
        mealInfo: '교내 급식 제공',
        sexOffenseCheckRequest: '행정정보 공동이용 조회 요청',
        sexOffenseRecordAttachmentFileName: `${organization.organizationId}-성범죄조회동의서.pdf`,
        textbookId: 'textbook-ja-economy-standard',
        combinedClassApplication: '미신청',
        combinedClassPartnerApplicantIds: [],
        combinedClassPartnerGrades: [],
        waitingPlaceGuide: '수업 시작 20분 전 교무실 방문',
        otherSpecialNotes: '학교 출입 시 신분증 지참',
      },
      ...(approvalStatus === 'rejected'
        ? { participationRejectionReason: '교육 일정과 프로그램 운영 기간이 맞지 않습니다.' }
        : {}),
      approvalNotifyTiming: 'immediate',
      rejectionNotifyTiming: 'immediate',
      approvalNotificationSentAt: `2026.09.${String(15 + index).padStart(2, '0')} 10:00`,
      adminComment: `${approvalStatus} 상태 QA 확인용 기관 신청입니다.`,
    }
  })
}

function buildParticipatingInstitutionRows(
  programId: GeneralInstitutionCaseProgramId
): ParticipatingSchoolRow[] {
  const teachers = [
    GENERAL_INSTITUTION_MEMBER_ROSTER.schoolTeacher,
    GENERAL_INSTITUTION_MEMBER_ROSTER.dualInstructor,
  ]
  return participatingApprovalStatuses.map((approvalStatus, index) => {
    const organization =
      GENERAL_INSTITUTION_ORGANIZATION_ROSTER[
        index % GENERAL_INSTITUTION_ORGANIZATION_ROSTER.length
      ]
    const teacher = teachers[index % teachers.length]
    const session = buildSession(index)
    return {
      id: buildGeneralInstitutionCaseId(programId, 'organization-participant', approvalStatus),
      organizationId: organization.organizationId,
      teacherMemberId: teacher.memberId,
      organizationApplicationId: buildGeneralInstitutionCaseId(
        programId,
        'organization-application',
        applicationStatuses[index % applicationStatuses.length]
      ),
      no: participatingApprovalStatuses.length - index,
      schoolName: organization.name,
      region: organization.address,
      educationGrade: `${index + 3}학년`,
      classCount: index + 1,
      studentCount: 30 + index * 15,
      lectureRound: `${index + 1}차시`,
      textbookStatus: textbookStatuses[index],
      approvalStatus,
      teacherName: teacher.name,
      instructors: `${GENERAL_INSTITUTION_MEMBER_ROSTER.instructor.name}, ${GENERAL_INSTITUTION_MEMBER_ROSTER.dualInstructor.name}`,
      sessions: [session],
      programId,
    }
  })
}

const applicationRowsByProgram = new Map(
  GENERAL_INSTITUTION_CASE_PROGRAM_IDS.map(programId => [
    programId,
    buildInstitutionApplicationRows(programId),
  ])
)

const participatingRowsByProgram = new Map(
  [...applicationRowsByProgram.keys()].map(programId => [
    programId,
    buildParticipatingInstitutionRows(programId),
  ])
)

export function getGeneralInstitutionCaseApplicationRows(
  programId: string
): ApplicantSchoolRow[] | null {
  if (!isGeneralInstitutionCaseProgramId(programId)) return null
  return cloneRows(applicationRowsByProgram.get(programId) ?? [])
}

export function getGeneralInstitutionCaseParticipatingRows(
  programId: string
): ParticipatingSchoolRow[] | null {
  if (!isGeneralInstitutionCaseProgramId(programId)) return null
  return cloneRows(participatingRowsByProgram.get(programId) ?? [])
}
