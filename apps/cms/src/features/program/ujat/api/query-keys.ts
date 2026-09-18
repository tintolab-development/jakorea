import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
import type { ListParams } from './list-params'
import type { UjatVolunteerRecruitHalf } from '../model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicationsStage } from './applications-list-query'

export const queryKeys = {
  all: ['cms', 'programs', 'ujat'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (scope: 'remote' | 'local', params: ListParams) =>
    [...queryKeys.lists(), scope, params] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (scope: 'remote' | 'local', programId: string) =>
    [...queryKeys.details(), scope, programId] as const,
  applications: () => [...queryKeys.all, 'applications'] as const,
  organizationApplications: (programId: string, query: ApplicationsListQuery = {}) =>
    [...queryKeys.applications(), 'organizations', programId, query] as const,
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
  scheduleAttendances: (programId: string, scheduleId: string) =>
    [...queryKeys.execution(), 'attendances', programId, scheduleId] as const,
}
