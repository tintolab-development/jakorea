import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  listAdminCommentsByTargetRemote,
  resolveLatestAdminCommentText,
  type AdminCommentTargetType,
} from '@/features/program/general/api/admin-comments-api-client'
import {
  fetchLatestFormResponseByContextRemote,
  type FormResponseContextType,
} from '@/features/program/general/api/form-responses-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { hydrateOrganizationApplicationRowFromForm } from '@/features/program/general/api/adapters/organization-application-form-adapters'
import {
  hydrateInstructorApplicationRowFromForm,
  hydrateVolunteerApplicationRowFromForm,
} from '@/features/program/general/api/adapters/application-form-detail-adapters'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

function parseNumericId(id: string | undefined): number | null {
  if (!id?.trim()) return null
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

function parseProgramId(programId: string | number | undefined | null): number | null {
  if (programId == null) return null
  const n = typeof programId === 'number' ? programId : Number(String(programId).trim())
  return Number.isFinite(n) ? n : null
}

function useApplicationFormAndComments(input: {
  enabled: boolean
  programId: number | null
  contextType: FormResponseContextType
  contextId: number | null
  targetType: AdminCommentTargetType
}) {
  const remote = shouldUseGeneralApplicationsRemoteApi()
  const enabled =
    input.enabled &&
    remote &&
    input.programId != null &&
    input.contextId != null

  const formQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.formByContext(
      String(input.programId ?? ''),
      input.contextType,
      String(input.contextId ?? '')
    ),
    queryFn: () =>
      fetchLatestFormResponseByContextRemote({
        programId: input.programId!,
        contextType: input.contextType,
        contextId: input.contextId!,
      }),
    enabled,
    staleTime: 30_000,
  })

  const commentsQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.commentsByTarget(
      input.targetType,
      String(input.contextId ?? '')
    ),
    queryFn: () =>
      listAdminCommentsByTargetRemote({
        targetType: input.targetType,
        targetId: input.contextId!,
      }),
    enabled,
    staleTime: 30_000,
  })

  const adminComment = useMemo(
    () => resolveLatestAdminCommentText(commentsQuery.data),
    [commentsQuery.data]
  )

  return {
    formResponse: formQuery.data ?? null,
    adminComment,
    isLoading: enabled && (formQuery.isLoading || commentsQuery.isLoading),
    isFetching: formQuery.isFetching || commentsQuery.isFetching,
  }
}

/** 일반 기관 신청 상세 — form_response + admin_comment hydrate */
export function useOrganizationApplicationDetailEnrichment(
  row: ApplicantSchoolRow | null | undefined,
  options?: { enabled?: boolean }
): ApplicantSchoolRow | null {
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row),
    programId,
    contextType: 'ORGANIZATION_APPLICATION',
    contextId,
    targetType: 'ORGANIZATION_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    if (!formResponse && !adminComment) return row
    return hydrateOrganizationApplicationRowFromForm({
      row,
      formResponse,
      adminComment,
    })
  }, [row, formResponse, adminComment])
}

/** 일반 강사 신청 상세 — form_response + admin_comment hydrate */
export function useInstructorApplicationDetailEnrichment(
  row: ApplicantInstructorRow | null | undefined,
  options?: { enabled?: boolean }
): ApplicantInstructorRow | null {
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row),
    programId,
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId,
    targetType: 'INSTRUCTOR_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    if (!formResponse && !adminComment) return row
    return hydrateInstructorApplicationRowFromForm({
      row,
      formResponse,
      adminComment,
    })
  }, [row, formResponse, adminComment])
}

/** 일반 봉사 신청 상세 — form_response hydrate (essay 등) */
export function useVolunteerApplicationDetailEnrichment(
  row: GeneralVolunteerApplicantRow | null | undefined,
  options?: { enabled?: boolean }
): GeneralVolunteerApplicantRow | null {
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row),
    programId,
    contextType: 'VOLUNTEER_APPLICATION',
    contextId,
    targetType: 'VOLUNTEER_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    if (!formResponse && !adminComment) return row
    return hydrateVolunteerApplicationRowFromForm({
      row,
      formResponse,
      adminComment,
    })
  }, [row, formResponse, adminComment])
}
