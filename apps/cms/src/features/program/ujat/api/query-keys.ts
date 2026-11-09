import type { UjatApplicationsListQuery as ApplicationsListQuery } from './ujat-applications-contract'
import type { ListParams } from './list-params'
import type { UjatVolunteerRecruitHalf } from '../model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicationsStage } from './applications-list-query'

export const queryKeys = {
  all: ['cms', 'programs', 'ujat'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  businessYears: (programType: 'UJAT') =>
    [...queryKeys.all, 'business-years', programType] as const,
  list: (scope: 'remote' | 'local', params: ListParams) =>
    [...queryKeys.lists(), scope, params] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  directAssignmentCandidatesRoot: (programId: string) =>
    [...queryKeys.all, 'direct-assignment-candidates', programId] as const,
  directAssignmentCandidates: (programId: string, educationSlotId: string) =>
    [...queryKeys.directAssignmentCandidatesRoot(programId), educationSlotId] as const,
  detail: (scope: 'remote' | 'local', programId: string) =>
    [...queryKeys.details(), scope, programId] as const,
  applications: () => [...queryKeys.all, 'applications'] as const,
  organizationApplicationsRoot: (programId: string) =>
    [...queryKeys.applications(), 'organizations', programId] as const,
  organizationApplications: (programId: string, query: ApplicationsListQuery = {}) =>
    [...queryKeys.organizationApplicationsRoot(programId), query] as const,
  organizationDetail: (programId: string, institutionId: string) =>
    [...queryKeys.organizationApplicationsRoot(programId), 'detail', institutionId] as const,
  organizationApplicationComments: (programId: string, institutionId: string) =>
    [...queryKeys.organizationApplicationsRoot(programId), 'comments', institutionId] as const,
  organizationTemporarySchedule: (programId: string, institutionId: string) =>
    [
      ...queryKeys.organizationApplicationsRoot(programId),
      'temporary-schedule',
      institutionId,
    ] as const,
  organizationScheduleAssignments: (
    programId: string,
    educationRegionCode: string = 'ALL'
  ) =>
    [
      ...queryKeys.organizationApplicationsRoot(programId),
      'schedule-assignments',
      educationRegionCode,
    ] as const,
  programSchedules: (programId: string) =>
    [...queryKeys.all, 'program-schedules', programId] as const,
  typedDetail: (programId: string) => [...queryKeys.all, 'typed-detail', programId] as const,
  volunteerApplicationsRoot: (programId: string) =>
    [...queryKeys.applications(), 'volunteers', programId] as const,
  volunteerApplications: (
    programId: string,
    half: UjatVolunteerRecruitHalf,
    stage: UjatVolunteerApplicationsStage = 'doc1',
    query: ApplicationsListQuery = {}
  ) => [...queryKeys.volunteerApplicationsRoot(programId), { half, stage, query }] as const,
  volunteerApplicationComments: (programId: string, applicationId: string) =>
    [...queryKeys.volunteerApplicationsRoot(programId), 'comments', applicationId] as const,
  volunteerApplicationDetail: (applicationId: string) =>
    [...queryKeys.applications(), 'volunteer-detail', applicationId] as const,
  execution: () => [...queryKeys.all, 'execution'] as const,
  educationProgressSummary: (programId: string) =>
    [...queryKeys.all, 'education-progress-summary', programId] as const,
  planningEstimates: (programId: string) =>
    [...queryKeys.execution(), 'planning-estimates', programId] as const,
  allocationMatrixRoot: (programId: string) =>
    [...queryKeys.execution(), 'allocation-matrix', programId] as const,
  allocationMatrix: (
    programId: string,
    educationRegionCode: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF' | 'ALL' = 'ALL'
  ) =>
    [
      ...queryKeys.allocationMatrixRoot(programId),
      educationRegionCode,
      semesterType,
    ] as const,
  assignmentSubmissionsAll: () => [...queryKeys.execution(), 'assignment-submissions'] as const,
  assignmentSubmissionsRoot: (programId: string) =>
    [...queryKeys.assignmentSubmissionsAll(), programId] as const,
  assignmentSubmissions: (
    programId: string,
    educationRegionCode: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF'
  ) =>
    [
      ...queryKeys.assignmentSubmissionsRoot(programId),
      educationRegionCode,
      semesterType,
    ] as const,
  /** 봉사자 상세 · 배정/출결 묶음. memberId로 조회하고 queryFn 안에서 participantId를 해석한다. */
  volunteerAssignmentProgressRoot: (programId: string) =>
    [...queryKeys.execution(), 'volunteer-assignment-progress', programId] as const,
  volunteerAssignmentProgress: (
    programId: string,
    memberId: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF',
    educationRegionCode: string
  ) =>
    [
      ...queryKeys.volunteerAssignmentProgressRoot(programId),
      memberId,
      semesterType,
      educationRegionCode,
    ] as const,
  partnerAssignmentsRoot: (programId: string) =>
    [...queryKeys.execution(), 'partner-assignments', programId] as const,
  partnerAssignments: (programId: string, scheduleId: string) =>
    [...queryKeys.partnerAssignmentsRoot(programId), scheduleId] as const,
  /** 기관 상세 배정 탭. 출결 담당자·학급 봉사자. Class E — 배정 변경이 잦아 30초. */
  institutionAssignmentRoot: (programId: string) =>
    [...queryKeys.execution(), 'institution-assignment', programId] as const,
  institutionAssignment: (
    programId: string,
    institutionId: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF'
  ) =>
    [...queryKeys.institutionAssignmentRoot(programId), institutionId, semesterType] as const,
  partnerRecommendationRoot: (programId: string) =>
    [...queryKeys.execution(), 'partner-recommendation', programId] as const,
  partnerRecommendation: (
    programId: string,
    scheduleId: string,
    organizationApplicationId?: number | null
  ) =>
    [
      ...queryKeys.partnerRecommendationRoot(programId),
      scheduleId,
      organizationApplicationId ?? 'all',
    ] as const,
  absenceReasons: (programId: string) =>
    [...queryKeys.execution(), 'absence-reasons', programId] as const,
  scheduleAttendances: (programId: string, scheduleId: string) =>
    [...queryKeys.execution(), 'attendances', programId, scheduleId] as const,
  volunteer1365AttendanceAll: (programId: string) =>
    [...queryKeys.all, 'volunteer-1365-attendance', programId] as const,
  volunteer1365Attendance: (
    programId: string,
    half: string,
    scheduleIdsKey: string
  ) =>
    [
      ...queryKeys.volunteer1365AttendanceAll(programId),
      half,
      scheduleIdsKey,
    ] as const,
  /** 1365 봉사시간 등록 양식 반기 일괄(PREVIEW) — 출석 변경 무효화(`volunteer1365AttendanceAll`) 하위 */
  volunteer1365SemesterForm: (programId: string, half: string) =>
    [...queryKeys.volunteer1365AttendanceAll(programId), 'semester-form', half] as const,
}
