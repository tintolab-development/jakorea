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

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

export function isOrganizationStudentDocumentsQueryEnabled(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
): boolean {
  return Boolean(
    isRemoteApiConfigured() &&
      getAccessToken() &&
      applicationType === 'ORGANIZATION' &&
      applicationId &&
      /^\d+$/.test(applicationId),
  )
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
) {
  const enabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId)
  const id = applicationId ?? ''

  return useQuery({
    queryKey: platformQueryKeys.mypage.organizationApplications.studentRoster(id),
    queryFn: ({ signal }) => fetchOrganizationStudentRoster(id, signal),
    enabled,
    ...queryOptions(),
  })
}

export function useOrganizationStudentDocumentPolicyQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const enabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId)
  const id = applicationId ?? ''

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
) {
  const enabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId)
  const id = applicationId ?? ''

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
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_FILE_PURPOSE_STUDENT_ROSTER,
      })
      return importOrganizationStudentRoster(applicationId, fileObjectId)
    },
    onSuccess: data => {
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.studentRoster(applicationId),
        data,
      )
    },
  })
}

export function useSubmitOrganizationPortraitConsentMutation(applicationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT,
      })
      return submitOrganizationPortraitConsent(applicationId, fileObjectId)
    },
    onSuccess: data => {
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.portraitConsent(applicationId),
        data,
      )
    },
  })
}

export function useDownloadStudentRosterTemplateMutation(applicationId: string) {
  return useMutation({
    mutationFn: () => downloadOrganizationStudentRosterTemplate(applicationId),
  })
}

export function useDownloadPortraitConsentTemplateMutation(applicationId: string) {
  return useMutation({
    mutationFn: () => downloadOrganizationPortraitConsentTemplate(applicationId),
  })
}
