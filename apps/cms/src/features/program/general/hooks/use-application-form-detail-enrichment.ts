import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  shouldUseGeneralApplicationsRemoteApi,
  shouldUseOrganizationApplicationRemoteApi,
} from '@/features/program/general/api/applications-remote-capabilities'
import {
  mapInstructorApplicationDetailToApplicantRow,
  mapOrganizationApplicationDetailToApplicantSchoolRow,
  softMergeOrganizationApplicationDetailOntoRow,
  mapVolunteerApplicationDetailToApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  fetchIndividualApplicationDetailRemote,
  fetchInstructorApplicationDetailRemote,
  fetchOrganizationApplicationDetailRemote,
  fetchVolunteerApplicationDetailRemote,
} from '@/features/program/general/api/applications-api-client'
import { organizationRequestedSchedulesQueryOptions } from '@/features/program/general/api/organization-requested-schedules-query'
import { mapRequestedSchedulesToSessions } from '@/features/program/1c-1s/lib/map-requested-schedules'
import {
  listAdminCommentsByTargetRemote,
  resolveLatestAdminCommentText,
  type AdminCommentTargetType,
} from '@/features/program/general/api/admin-comments-api-client'
import {
  getFormResponseRemote,
  fetchLatestFormResponseByContextRemote,
  type FormResponseContextType,
} from '@/features/program/general/api/form-responses-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { hydrateOrganizationApplicationRowFromForm } from '@/features/program/general/api/adapters/organization-application-form-adapters'
import {
  hydrateInstructorApplicationRowFromForm,
  hydrateVolunteerApplicationRowFromForm,
} from '@/features/program/general/api/adapters/application-form-detail-adapters'
import {
  fetchInstructorMemberDetailRemote,
  fetchTeacherMemberDetailRemote,
} from '@/features/user/api/members-api-client'
import { mapInstructorMemberDetailToUser } from '@/features/user/api/map-member-detail-to-user'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  instructorApplicationRowNeedsMemberBasicInfoSupplement,
  supplementApplicantInstructorBasicInfoFromMember,
} from '@/features/program/general/lib/instructor-application-basic-info-supplement'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import {
  mapInstructorApplicationDetailToParticipatingRow,
  mergeInstructorApplicationIntoParticipatingRow,
  participatingRowToInstructorApplicationSeed,
} from '@/features/program/general/lib/participating-instructor-application-detail'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { mapIndividualApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-individual-application-detail'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import {
  mapVolunteerApplicationDetailToParticipatingRow,
  mergeVolunteerApplicationIntoParticipatingRow,
  participatingRowToVolunteerApplicationSeed,
} from '@/features/program/general/lib/participating-volunteer-application-detail'
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
  formResponseId?: number | null
  allowContextFormResponseLookup?: boolean
}) {
  const remote =
    input.contextType === 'ORGANIZATION_APPLICATION' ||
    input.contextType === 'INSTRUCTOR_APPLICATION'
      ? shouldUseOrganizationApplicationRemoteApi()
      : shouldUseGeneralApplicationsRemoteApi()
  const queryEnabled = input.enabled && remote && input.programId != null && input.contextId != null

  const hasDirectFormResponse = input.formResponseId != null && input.formResponseId > 0
  const formEnabled =
    queryEnabled && (hasDirectFormResponse || input.allowContextFormResponseLookup !== false)

  const formQuery = useQuery({
    queryKey: hasDirectFormResponse
      ? generalApplicationsQueryKeys.formDetail(String(input.formResponseId))
      : generalApplicationsQueryKeys.formByContext(
          String(input.programId ?? ''),
          input.contextType,
          String(input.contextId ?? '')
        ),
    queryFn: () =>
      hasDirectFormResponse
        ? getFormResponseRemote(input.formResponseId!)
        : fetchLatestFormResponseByContextRemote({
            programId: input.programId!,
            contextType: input.contextType,
            contextId: input.contextId!,
          }),
    enabled: formEnabled,
    staleTime: 30_000,
    retry: false,
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
    enabled: queryEnabled,
    staleTime: 30_000,
  })

  const adminComment = useMemo(
    () => resolveLatestAdminCommentText(commentsQuery.data),
    [commentsQuery.data]
  )

  return {
    formResponse: formQuery.data ?? null,
    adminComment,
    isLoading: queryEnabled && (formQuery.isLoading || commentsQuery.isLoading),
    isFetching: formQuery.isFetching || commentsQuery.isFetching,
  }
}

/** 일반 기관 신청 상세 — form_response + admin_comment hydrate */
export function useOrganizationApplicationDetailEnrichment(
  row: ApplicantSchoolRow | null | undefined,
  options?: {
    enabled?: boolean
    skipCanonicalDetail?: boolean
    /** TT — 상세 GET 하되 목록 SoT는 유지하고 PII·부가 필드만 soft-merge */
    softMergeDetail?: boolean
  }
): ApplicantSchoolRow | null {
  const softMerge = options?.softMergeDetail === true
  const skipDetail = options?.skipCanonicalDetail === true && !softMerge
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.organizationDetail(String(contextId ?? '')),
    queryFn: () => fetchOrganizationApplicationDetailRemote(String(contextId)),
    enabled: Boolean(
      options?.enabled !== false &&
      !skipDetail &&
      row &&
      shouldUseOrganizationApplicationRemoteApi() &&
      contextId != null
    ),
    staleTime: 30_000,
    retry: false,
  })
  const organizationRemoteEnabled = shouldUseOrganizationApplicationRemoteApi()
  const { formResponse, adminComment } = useApplicationFormAndComments({
    // 기관 상세 응답의 latestFormResponseId가 확정된 뒤에만 form response를 조회한다.
    // context 목록의 첫 항목을 임의로 선택하면 이전 응답이 화면에 섞일 수 있다.
    enabled: Boolean(options?.enabled !== false && row && detailQuery.isFetched),
    programId,
    contextType: 'ORGANIZATION_APPLICATION',
    contextId,
    targetType: 'ORGANIZATION_APPLICATION',
    formResponseId: detailQuery.data?.latestFormResponseId,
    allowContextFormResponseLookup: !organizationRemoteEnabled,
  })

  const hydrated = useMemo(() => {
    if (!row) return null
    const canonical = detailQuery.data
      ? softMerge
        ? softMergeOrganizationApplicationDetailOntoRow(detailQuery.data, row)
        : skipDetail
          ? row
          : mapOrganizationApplicationDetailToApplicantSchoolRow(detailQuery.data, row)
      : row
    if (!formResponse && !adminComment) return canonical
    return hydrateOrganizationApplicationRowFromForm({
      row: canonical,
      formResponse,
      adminComment,
      canonicalDetail: detailQuery.data,
    })
  }, [row, detailQuery.data, formResponse, adminComment, softMerge, skipDetail])

  const requestedSchedulesQuery = useQuery({
    ...organizationRequestedSchedulesQueryOptions(String(contextId ?? '')),
    enabled: Boolean(options?.enabled !== false && organizationRemoteEnabled && contextId != null),
  })

  const hydratedWithSchedules = useMemo(() => {
    if (!hydrated) return null
    if (!organizationRemoteEnabled) return hydrated

    if (requestedSchedulesQuery.isPending) {
      if (softMerge) {
        return { ...hydrated, requestedSchedulesSyncState: 'loading' as const }
      }
      return {
        ...hydrated,
        sessions: undefined,
        requestedSchedulesSyncState: 'loading' as const,
      }
    }

    const fromRequested = mapRequestedSchedulesToSessions(requestedSchedulesQuery.data ?? []) ?? []
    if (fromRequested.length > 0) {
      return {
        ...hydrated,
        sessions: fromRequested,
        requestedSchedulesSyncState: 'ready' as const,
      }
    }

    if (softMerge) {
      return { ...hydrated, requestedSchedulesSyncState: 'ready' as const }
    }

    return {
      ...hydrated,
      sessions: undefined,
      requestedSchedulesSyncState: 'ready' as const,
    }
  }, [
    hydrated,
    organizationRemoteEnabled,
    requestedSchedulesQuery.data,
    requestedSchedulesQuery.isPending,
    softMerge,
  ])

  const teacherMemberId = hydratedWithSchedules?.teacherMemberId
  const needsMemberEmail =
    softMerge && teacherMemberId != null && !hydratedWithSchedules?.detail?.teacherEmail?.trim()

  const memberEmailQuery = useQuery({
    queryKey: ['organization-application-teacher-member-email', teacherMemberId],
    queryFn: async () => {
      const detail = await fetchTeacherMemberDetailRemote(teacherMemberId!)
      return detail.member?.email?.trim() || null
    },
    enabled: Boolean(
      options?.enabled !== false &&
      needsMemberEmail &&
      isMembersRemoteEnabled() &&
      teacherMemberId != null
    ),
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => {
    if (!hydratedWithSchedules) return null
    const memberEmail = memberEmailQuery.data?.trim()
    if (!memberEmail || hydratedWithSchedules.detail?.teacherEmail?.trim()) {
      return hydratedWithSchedules
    }
    return {
      ...hydratedWithSchedules,
      detail: {
        ...hydratedWithSchedules.detail,
        teacherEmail: memberEmail,
        teacherInfo: undefined,
      },
    }
  }, [hydratedWithSchedules, memberEmailQuery.data])
}

/** 일반 강사 신청 상세 — form_response + admin_comment hydrate */
export function useInstructorApplicationDetailEnrichment(
  row: ApplicantInstructorRow | null | undefined,
  options?: { enabled?: boolean }
): ApplicantInstructorRow | null {
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorDetail(String(contextId ?? '')),
    queryFn: () => fetchInstructorApplicationDetailRemote(String(contextId)),
    enabled: Boolean(
      options?.enabled !== false &&
      row &&
      shouldUseOrganizationApplicationRemoteApi() &&
      contextId != null
    ),
    staleTime: 30_000,
    retry: false,
  })
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row),
    programId,
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId,
    targetType: 'INSTRUCTOR_APPLICATION',
  })

  const instructorMemberId = row?.instructorMemberId
  const mergedFromApplicationDetail = useMemo(() => {
    if (!row) return null
    return detailQuery.data
      ? mapInstructorApplicationDetailToApplicantRow(detailQuery.data, row)
      : row
  }, [row, detailQuery.data])

  const needsMemberBasicInfo = useMemo(
    () =>
      mergedFromApplicationDetail != null &&
      instructorMemberId != null &&
      Number.isFinite(instructorMemberId) &&
      isMembersRemoteEnabled() &&
      instructorApplicationRowNeedsMemberBasicInfoSupplement(mergedFromApplicationDetail),
    [instructorMemberId, mergedFromApplicationDetail]
  )

  const memberBasicInfoQuery = useQuery({
    queryKey: ['instructor-application-member-basic-info', instructorMemberId],
    queryFn: async () => {
      const detail = await fetchInstructorMemberDetailRemote(instructorMemberId!)
      return mapInstructorMemberDetailToUser(detail)
    },
    enabled: Boolean(
      options?.enabled !== false && needsMemberBasicInfo && instructorMemberId != null
    ),
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => {
    if (!mergedFromApplicationDetail) return null
    let canonical = mergedFromApplicationDetail
    if (memberBasicInfoQuery.data) {
      canonical = supplementApplicantInstructorBasicInfoFromMember(
        canonical,
        memberBasicInfoQuery.data
      )
    }
    if (!formResponse && !adminComment) return canonical
    return hydrateInstructorApplicationRowFromForm({
      row: canonical,
      formResponse,
      adminComment,
    })
  }, [mergedFromApplicationDetail, formResponse, adminComment, memberBasicInfoQuery.data])
}

/** 참여 강사 상세 — 신청 정보 탭 (instructor-applications GET + form_response hydrate) */
export function useParticipatingInstructorApplicationDetailEnrichment(
  row: ParticipatingInstructorRow | null | undefined,
  programId: string,
  options?: { enabled?: boolean }
): ParticipatingInstructorRow | null {
  const applicationId = parseNumericId(row?.instructorApplicationId)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorDetail(String(applicationId ?? '')),
    queryFn: () => fetchInstructorApplicationDetailRemote(String(applicationId)),
    enabled: Boolean(
      options?.enabled !== false &&
      row &&
      shouldUseOrganizationApplicationRemoteApi() &&
      applicationId != null
    ),
    staleTime: 30_000,
    retry: false,
  })
  const parsedProgramId = parseProgramId(programId)
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row && applicationId != null),
    programId: parsedProgramId,
    contextType: 'INSTRUCTOR_APPLICATION',
    contextId: applicationId,
    targetType: 'INSTRUCTOR_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    if (!detailQuery.data) {
      if (!formResponse && !adminComment) return row
      const seed = participatingRowToInstructorApplicationSeed(row, programId)
      const hydrated = hydrateInstructorApplicationRowFromForm({
        row: seed,
        formResponse,
        adminComment,
      })
      return mergeInstructorApplicationIntoParticipatingRow(row, hydrated)
    }
    const canonical = mapInstructorApplicationDetailToParticipatingRow(
      detailQuery.data,
      row,
      programId
    )
    if (!formResponse && !adminComment) return canonical
    const seed = participatingRowToInstructorApplicationSeed(canonical, programId)
    const hydrated = hydrateInstructorApplicationRowFromForm({
      row: seed,
      formResponse,
      adminComment,
    })
    return mergeInstructorApplicationIntoParticipatingRow(canonical, hydrated)
  }, [row, programId, detailQuery.data, formResponse, adminComment])
}

/** 참여자(개인) 상세 — 신청 정보 탭 (individual-applications GET) */
export function useParticipatingIndividualApplicationDetailEnrichment(
  row: ParticipatingIndividualParticipantRow | null | undefined,
  options?: { enabled?: boolean }
): ParticipatingIndividualParticipantRow | null {
  const applicationId = parseNumericId(row?.individualApplicationId)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.individualDetail(String(applicationId ?? '')),
    queryFn: () => fetchIndividualApplicationDetailRemote(String(applicationId)),
    enabled: Boolean(
      options?.enabled !== false &&
      row &&
      shouldUseGeneralApplicationsRemoteApi() &&
      applicationId != null
    ),
    staleTime: 30_000,
    retry: false,
  })

  return useMemo(() => {
    if (!row) return null
    if (!detailQuery.data) return row
    return mapIndividualApplicationDetailToParticipatingRow(detailQuery.data, row)
  }, [row, detailQuery.data])
}

/** 참여 봉사자 상세 — 신청 정보 탭 (volunteer-applications GET + form hydrate) */
export function useParticipatingVolunteerApplicationDetailEnrichment(
  row: ParticipatingVolunteerRow | null | undefined,
  options?: { enabled?: boolean }
): ParticipatingVolunteerRow | null {
  const applicationId = parseNumericId(row?.volunteerApplicationId)
  const programId = parseProgramId(row?.programId)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.volunteerDetail(String(applicationId ?? '')),
    queryFn: () => fetchVolunteerApplicationDetailRemote(String(applicationId)),
    enabled: Boolean(
      options?.enabled !== false &&
      row &&
      shouldUseGeneralApplicationsRemoteApi() &&
      applicationId != null
    ),
    staleTime: 30_000,
    retry: false,
  })
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row && applicationId != null),
    programId,
    contextType: 'VOLUNTEER_APPLICATION',
    contextId: applicationId,
    targetType: 'VOLUNTEER_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    if (!detailQuery.data) {
      if (!formResponse && !adminComment) return row
      const seed = participatingRowToVolunteerApplicationSeed(row)
      const hydrated = hydrateVolunteerApplicationRowFromForm({
        row: { ...seed, id: row.volunteerApplicationId ?? seed.id },
        formResponse,
        adminComment,
      })
      return mergeVolunteerApplicationIntoParticipatingRow(row, hydrated)
    }
    const canonical = mapVolunteerApplicationDetailToParticipatingRow(detailQuery.data, row)
    if (!formResponse && !adminComment) return canonical
    const seed = participatingRowToVolunteerApplicationSeed(canonical)
    const hydrated = hydrateVolunteerApplicationRowFromForm({
      row: {
        ...seed,
        id: canonical.volunteerApplicationId ?? seed.id,
      },
      formResponse,
      adminComment,
    })
    return mergeVolunteerApplicationIntoParticipatingRow(canonical, hydrated)
  }, [row, detailQuery.data, formResponse, adminComment])
}

/** 일반 봉사 신청 상세 — form_response hydrate (essay 등) */
export function useVolunteerApplicationDetailEnrichment(
  row: GeneralVolunteerApplicantRow | null | undefined,
  options?: { enabled?: boolean }
): GeneralVolunteerApplicantRow | null {
  const programId = parseProgramId(row?.programId)
  const contextId = parseNumericId(row?.id)
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.volunteerDetail(String(contextId ?? '')),
    queryFn: () => fetchVolunteerApplicationDetailRemote(String(contextId)),
    enabled: Boolean(
      options?.enabled !== false &&
      row &&
      shouldUseGeneralApplicationsRemoteApi() &&
      contextId != null
    ),
    staleTime: 30_000,
    retry: false,
  })
  const { formResponse, adminComment } = useApplicationFormAndComments({
    enabled: Boolean(options?.enabled !== false && row),
    programId,
    contextType: 'VOLUNTEER_APPLICATION',
    contextId,
    targetType: 'VOLUNTEER_APPLICATION',
  })

  return useMemo(() => {
    if (!row) return null
    const canonical = detailQuery.data
      ? mapVolunteerApplicationDetailToApplicantRow(detailQuery.data, row)
      : row
    if (!formResponse && !adminComment) return canonical
    return hydrateVolunteerApplicationRowFromForm({
      row: canonical,
      formResponse,
      adminComment,
    })
  }, [row, detailQuery.data, formResponse, adminComment])
}
