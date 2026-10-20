import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from './types'
import {
  commitOrganizationStudentRoster,
  downloadOrganizationPortraitConsentTemplate,
  downloadOrganizationStudentRosterTemplate,
  fetchOrganizationPortraitConsent,
  fetchOrganizationStudentDocumentPolicy,
  fetchOrganizationStudentRoster,
  importOrganizationStudentRoster,
  submitOrganizationPortraitConsent,
} from './student-documents-client'
import type {
  PortalStudentRosterCommitRequest,
  PortalStudentRosterResponse,
} from './student-documents-types'
import {
  PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT,
  PORTAL_FILE_PURPOSE_STUDENT_ROSTER,
} from './student-documents-types'
import type { PortraitConsentTemplateDownloadProgress } from '../lib/student-documents-template-download'
import { resolveOrganizationApplicationId } from '../lib/resolve-organization-application-id'
import { STUDENT_ROSTER_UPLOAD_MAX_BYTES } from '../lib/student-roster-upload-policy'

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

async function invalidateStudentDocumentDependents(
  queryClient: ReturnType<typeof useQueryClient>,
  input: {
    applicationId: string
    applicationType?: ProgramApplicationType | null
    programId?: number | null
  },
): Promise<void> {
  const tasks = [
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.organizationApplications.studentRoster(
        input.applicationId,
      ),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.organizationApplications.studentDocumentsPolicy(
        input.applicationId,
      ),
      exact: true,
    }),
    // 신청 목록의 학생명단 제출 상태 요약이 바뀔 수 있습니다.
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
    }),
  ]

  if (input.applicationType) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          input.applicationType,
          input.applicationId,
        ),
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.schedules(
          input.applicationType,
          input.applicationId,
        ),
        exact: true,
      }),
    )
  }

  if (input.programId != null) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.educationJournals(
          String(input.programId),
          input.applicationId,
        ),
        exact: true,
      }),
    )
  }

  await Promise.all(tasks)
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

export function useImportOrganizationStudentRosterMutation(
  applicationId: string,
  applicationType?: ProgramApplicationType | null,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_FILE_PURPOSE_STUDENT_ROSTER,
        policy: { maxBytes: STUDENT_ROSTER_UPLOAD_MAX_BYTES },
      })
      return importOrganizationStudentRoster(orgApplicationId, fileObjectId)
    },
    onSuccess: async (data, _file, _ctx) => {
      const orgApplicationId = resolveOrganizationApplicationId(applicationId)
      if (!orgApplicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.studentRoster(orgApplicationId),
        data,
      )
      await invalidateStudentDocumentDependents(queryClient, {
        applicationId: orgApplicationId,
        applicationType,
        programId: data.programId,
      })
    },
    retry: false,
  })
}

/** 수동 편집 화면에서만 사용합니다. maskedPhone/maskedEmail 응답을 이 요청에 재사용하지 않습니다. */
export function useCommitOrganizationStudentRosterMutation(
  applicationId: string,
  applicationType?: ProgramApplicationType | null,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PortalStudentRosterCommitRequest): Promise<PortalStudentRosterResponse> => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      return commitOrganizationStudentRoster(orgApplicationId, request)
    },
    onSuccess: async (data, _request) => {
      const orgApplicationId = resolveOrganizationApplicationId(applicationId)
      if (!orgApplicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.studentRoster(orgApplicationId),
        data,
      )
      await invalidateStudentDocumentDependents(queryClient, {
        applicationId: orgApplicationId,
        applicationType,
        programId: data.programId,
      })
    },
    retry: false,
  })
}

export function useSubmitOrganizationPortraitConsentMutation(
  applicationId: string,
  applicationType?: ProgramApplicationType | null,
) {
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
    onSuccess: async data => {
      const orgApplicationId = resolveOrganizationApplicationId(applicationId)
      if (!orgApplicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.organizationApplications.portraitConsent(orgApplicationId),
        data,
      )
      await invalidateStudentDocumentDependents(queryClient, {
        applicationId: orgApplicationId,
        applicationType,
        programId: data.programId,
      })
    },
    retry: false,
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

export function useDownloadPortraitConsentTemplateMutation(
  applicationId: string,
  options?: { onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void },
) {
  return useMutation({
    mutationFn: () => {
      const orgApplicationId = requireOrganizationApplicationId(applicationId)
      return downloadOrganizationPortraitConsentTemplate(orgApplicationId, options?.onProgress)
    },
    retry: false,
  })
}
