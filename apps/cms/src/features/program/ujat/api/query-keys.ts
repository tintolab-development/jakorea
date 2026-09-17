import type { ListParams } from './list-params'
import type { UjatVolunteerRecruitHalf } from '../model/ujat-volunteer-screening-constants'

export const queryKeys = {
  all: ['cms', 'programs', 'ujat'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (scope: 'remote' | 'local', params: ListParams) =>
    [...queryKeys.lists(), scope, params] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (scope: 'remote' | 'local', programId: string) =>
    [...queryKeys.details(), scope, programId] as const,
  applications: () => [...queryKeys.all, 'applications'] as const,
  organizationApplications: (programId: string) =>
    [...queryKeys.applications(), 'organizations', programId] as const,
  volunteerApplications: (programId: string, half: UjatVolunteerRecruitHalf) =>
    [...queryKeys.applications(), 'volunteers', programId, { half }] as const,
}
