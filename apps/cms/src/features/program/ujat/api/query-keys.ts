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
  planningEstimates: (programId: string) =>
    [...queryKeys.execution(), 'planning-estimates', programId] as const,
  allocationMatrix: (
    programId: string,
    educationRegionCode: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF' | 'ALL' = 'ALL'
  ) =>
    [
      ...queryKeys.execution(),
      'allocation-matrix',
      programId,
      educationRegionCode,
      semesterType,
    ] as const,
  assignmentSubmissions: (
    programId: string,
    educationRegionCode: string,
    semesterType: 'FIRST_HALF' | 'SECOND_HALF'
  ) =>
    [
      ...queryKeys.execution(),
      'assignment-submissions',
      programId,
      educationRegionCode,
      semesterType,
    ] as const,
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
}
