import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from './types'
import {
  downloadOrganizationPortraitConsentTemplate,
  downloadOrganizationStudentRosterTemplate,
  fetchOrganizationPortraitConsent,
  fetchOrganizationStudentDocumentPolicy,
  fetchOrganizationStudentRoster,
  importOrganizationStudentRoster,
  submitOrganizationPortraitConsent,
} from './student-documents-client'
import {
  PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT,
  PORTAL_FILE_PURPOSE_STUDENT_ROSTER,
} from './student-documents-types'
import { resolveOrganizationApplicationId } from '../lib/resolve-organization-application-id'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

export type OrganizationStudentDocumentsScope = {
  /** `program.programAudience === 'organization'` — applicationType 누락 시 보조 */
  organizationProgram?: boolean
}

export type OrganizationStudentDocumentsQueryOptions = {
  /** policy `studentDocumentsSupported === true`일 때만 roster/portrait 조회 */
  studentDocumentsSupported?: boolean
}

function isOrganizationApplicationScope(
  applicationType: ProgramApplicationType | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
): boolean {
  return applicationType === 'ORGANIZATION' || scope?.organizationProgram === true
}

export function isOrganizationStudentDocumentsUiScope(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
): boolean {
  return Boolean(
    resolveOrganizationApplicationId(applicationId) &&
      isOrganizationApplicationScope(applicationType, scope),
  )
}

export function isOrganizationStudentDocumentsQueryEnabled(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
): boolean {
  return Boolean(
    isRemoteApiConfigured() &&
      getAccessToken() &&
      isOrganizationStudentDocumentsUiScope(applicationType, applicationId, scope),
  )
}

function requireOrganizationApplicationId(applicationId: string): string {
  const id = resolveOrganizationApplicationId(applicationId)
  if (!id) throw new Error('신청 정보가 올바르지 않습니다.')
  return id
}

function queryOptions() {
  return {
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

export function useOrganizationStudentRosterQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
  options?: OrganizationStudentDocumentsQueryOptions,
) {
  const baseEnabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId, scope)
  const enabled = baseEnabled && options?.studentDocumentsSupported === true
  const id = resolveOrganizationApplicationId(applicationId) ?? ''

  return useQuery({
    queryKey: platformQueryKeys.mypage.organizationApplications.studentRoster(id),
    queryFn: ({ signal }) => fetchOrganizationStudentRoster(id, signal),
    enabled,
    ...queryOptions(),
  })
}

export type OrganizationStudentDocumentPolicyQueryOptions = {
  /** 기본 true — 교사 탭 노출 판단 등에서 불필요한 policy 조회를 막을 때 false */
  enabled?: boolean
}

export function useOrganizationStudentDocumentPolicyQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
  options?: OrganizationStudentDocumentPolicyQueryOptions,
) {
  const enabled =
    isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId, scope) &&
    (options?.enabled ?? true)
  const id = resolveOrganizationApplicationId(applicationId) ?? ''

  return useQuery({
    queryKey: platformQueryKeys.mypage.organizationApplications.studentDocumentsPolicy(id),
    queryFn: ({ signal }) => fetchOrganizationStudentDocumentPolicy(id, signal),
    enabled,
    ...queryOptions(),
  })
}

export function useOrganizationPortraitConsentQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scope?: OrganizationStudentDocumentsScope,
  options?: OrganizationStudentDocumentsQueryOptions,
) {
  const baseEnabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId, scope)
  const enabled = baseEnabled && options?.studentDocumentsSupported === true
  const id = resolveOrganizationApplicationId(applicationId) ?? ''

  return useQuery({
    queryKey: platformQueryKeys.mypage.organizationApplications.portraitConsent(id),
    queryFn: ({ signal }) => fetchOrganizationPortraitConsent(id, signal),
    enabled,
    ...queryOptions(),
  })
}

export function useImportOrganizationStudentRosterMutation(applicationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_FILE_PURPOSE_STUDENT_ROSTER,
      })
      return importOrganizationStudentRoster(orgApplicationId, fileObjectId)
    },
    onSuccess: (data, _file, _ctx) => {
      const orgApplicationId = resolveOrganizationApplicationId(applicationId)
      if (!orgApplicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.studentRoster(orgApplicationId),
        data,
      )
    },
  })
}

export function useSubmitOrganizationPortraitConsentMutation(applicationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT,
      })
      return submitOrganizationPortraitConsent(orgApplicationId, fileObjectId)
    },
    onSuccess: data => {
      const orgApplicationId = resolveOrganizationApplicationId(applicationId)
      if (!orgApplicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.portraitConsent(orgApplicationId),
        data,
      )
    },
  })
}

export function useDownloadStudentRosterTemplateMutation(applicationId: string) {
  return useMutation({
    mutationFn: () => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      return downloadOrganizationStudentRosterTemplate(orgApplicationId)
    },
  })
}

export function useDownloadPortraitConsentTemplateMutation(applicationId: string) {
  return useMutation({
    mutationFn: () => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      return downloadOrganizationPortraitConsentTemplate(orgApplicationId)
    },
  })
}
