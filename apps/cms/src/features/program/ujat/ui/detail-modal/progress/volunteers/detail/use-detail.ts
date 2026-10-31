/**
 * UJAT 교육 진행 · 봉사자 상세 — 승인 봉사 신청 목록에서 hydrate
 */

import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { fetchVolunteerApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { applyUjatVolunteerApplicationDetail } from '@/features/program/ujat/lib/ujat-volunteer-application-detail'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  listAdminCommentsByTargetRemote,
  resolveLatestAdminCommentText,
} from '@/features/program/general/api/admin-comments-api-client'
import { parseVolunteerApplicationNumericId } from '@/features/program/ujat/lib/volunteer-application-id'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { UjatEducationProgressVolunteerDetail } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/detail/volunteer-detail-data'
import type { UjatEducationProgressVolunteerRow } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import { UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import {
  getUjatEducationRegionLabel,
  findUjatEducationRegionKeyByCode,
  findUjatEducationRegionKeyByLabel,
} from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'

function recruitHalfFromProgress(half: EducationProgressHalfKey): UjatVolunteerRecruitHalf {
  return half === 'h2' ? 'h2' : 'h1'
}

function mapApplicantToProgressRow(
  applicant: UjatVolunteerApplicantRow,
  index: number
): UjatEducationProgressVolunteerRow {
  const regionKey = (findUjatEducationRegionKeyByCode(applicant.preferredRegionCode) ??
    findUjatEducationRegionKeyByLabel(applicant.preferredRegion.trim()) ??
    '') as UjatInstitutionApplicationRegionKey
  const grade = (
    UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS as readonly string[]
  ).includes(applicant.grade)
    ? (applicant.grade as UjatEducationProgressVolunteerRow['grade'])
    : ''
  const withdrawn = applicant.interviewAssignmentStatus === 'withdrawn'
  const completed =
    applicant.secondInterviewScreeningStatus === 'pass' ||
    applicant.secondInterviewScreeningStatus === 'completed'

  return {
    id: applicant.id,
    no: index + 1,
    volunteerName: applicant.name,
    grade,
    regionKey,
    regionLabel: getUjatEducationRegionLabel(regionKey, regionKey),
    mobile: applicant.contact,
    email: applicant.email,
    totalAssignedDays: typeof applicant.totalAssignedDays === 'number' ? applicant.totalAssignedDays : null,
    assignmentStatus: withdrawn
      ? 'activity_abandoned'
      : completed
        ? 'assignment_completed'
        : 'assignment_waiting',
  }
}

export function useUjatEducationProgressVolunteerDetail(input: {
  programId: string
  half: EducationProgressHalfKey
  volunteerId: string
}) {
  const { programId, half, volunteerId } = input
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const recruitHalf = recruitHalfFromProgress(half)

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      ...ujatQueryKeys.volunteerApplications(programId, recruitHalf, 'interview2', {
        finalResultStatus: 'APPROVED',
      }),
      'edu-progress-detail',
    ] as const,
    queryFn: ({ pageParam }) =>
      listUjatVolunteerApplicationsPage(programId, recruitHalf, pageParam, {
        finalResultStatus: 'APPROVED',
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && Boolean(volunteerId),
    staleTime: 30_000,
    retry: false,
  })

  const applicationNumericId = parseVolunteerApplicationNumericId(volunteerId)
  const volunteerDetailQuery = useQuery({
    queryKey: ujatQueryKeys.volunteerApplicationDetail(volunteerId),
    queryFn: () => fetchVolunteerApplicationDetailRemote(String(applicationNumericId)),
    enabled: remoteEnabled && applicationNumericId != null,
    staleTime: 30_000,
    retry: false,
  })
  const commentsQuery = useQuery({
    queryKey: ujatQueryKeys.volunteerApplicationComments(programId, volunteerId),
    queryFn: () =>
      listAdminCommentsByTargetRemote({
        targetType: 'VOLUNTEER_APPLICATION',
        targetId: applicationNumericId!,
        screenCode: 'VOLUNTEER_APPLICATION',
      }),
    enabled: remoteEnabled && applicationNumericId != null,
    staleTime: 60_000,
    retry: false,
  })

  const detail = useMemo((): UjatEducationProgressVolunteerDetail | null => {
    if (remoteEnabled) {
      const applicants = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
      const applicantIndex = applicants.findIndex(row => row.id === volunteerId)
      if (applicantIndex < 0) return null
      const listApplicant = applicants[applicantIndex]!
      const applicant = volunteerDetailQuery.data
        ? applyUjatVolunteerApplicationDetail(
            listApplicant,
            volunteerDetailQuery.data.application,
            volunteerDetailQuery.data.profile
          )
        : listApplicant
      return {
        volunteerId,
        half,
        row: mapApplicantToProgressRow(applicant, applicantIndex),
        applicant,
        adminComment: resolveLatestAdminCommentText(commentsQuery.data) ?? '',
      }
    }
    return null
  }, [
    commentsQuery.data,
    half,
    programId,
    remoteEnabled,
    remoteQuery.data,
    volunteerDetailQuery.data,
    volunteerId,
  ])

  return {
    detail,
    loading: remoteEnabled ? remoteQuery.isLoading || remoteQuery.isFetching : false,
  }
}
