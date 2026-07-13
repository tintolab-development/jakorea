import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas/applicationDecisionResponse'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { IndividualApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationListItemResponse'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { PageResponseOrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseOrganizationApplicationListItemResponse'
import type { DocumentResultRequest } from '@/shared/api/generated/dashboard/schemas/documentResultRequest'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { VolunteerFinalResultRequest } from '@/shared/api/generated/dashboard/schemas/volunteerFinalResultRequest'

export type ApplicationsListQuery = {
  status?: string
  page?: number
  size?: number
}

export interface ApplicationsPageDto<T> {
  items?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

async function fetchApplicationsPage<T>(
  url: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<T>> {
  return unwrapApiBody<ApplicationsPageDto<T>>(
    await customInstance({
      url,
      method: 'GET',
      params,
    })
  )
}

export async function fetchOrganizationApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<OrganizationApplicationListItemResponse>> {
  return fetchApplicationsPage<OrganizationApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/organization-applications`,
    params
  )
}

export async function fetchInstructorApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<InstructorApplicationListItemResponse>> {
  return fetchApplicationsPage<InstructorApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/instructor-applications`,
    params
  )
}

export async function fetchIndividualApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<IndividualApplicationListItemResponse>> {
  return fetchApplicationsPage<IndividualApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/individual-applications`,
    params
  )
}

export async function fetchVolunteerApplicationsRemote(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicationsPageDto<VolunteerApplicationListItemResponse>> {
  return fetchApplicationsPage<VolunteerApplicationListItemResponse>(
    `/api/admin/programs/${encodeURIComponent(programId)}/volunteer-applications`,
    params
  )
}

export async function approveOrganizationApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectOrganizationApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/organization-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function approveInstructorApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectInstructorApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/instructor-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function approveIndividualApplicationRemote(
  applicationId: string
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
    })
  )
}

export async function rejectIndividualApplicationRemote(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/individual-applications/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitVolunteerDocumentResultRemote(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/document-result`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function submitVolunteerFinalResultRemote(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<ApplicationDecisionResponse> {
  return unwrapApiBody<ApplicationDecisionResponse>(
    await customInstance({
      url: `/api/admin/volunteer-applications/${encodeURIComponent(applicationId)}/final-result`,
      method: 'POST',
      data: payload,
    })
  )
}

export type { PageResponseOrganizationApplicationListItemResponse }
