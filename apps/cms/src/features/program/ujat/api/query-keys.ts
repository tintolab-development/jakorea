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
  programSchedules: (programId: string) =>
    [...queryKeys.all, 'program-schedules', programId] as const,
  volunteerApplications: (
    programId: string,
    half: UjatVolunteerRecruitHalf,
    stage: UjatVolunteerApplicationsStage = 'doc1',
    query: ApplicationsListQuery = {}
  ) => [...queryKeys.applications(), 'volunteers', programId, { half, stage, query }] as const,
  execution: () => [...queryKeys.all, 'execution'] as const,
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
