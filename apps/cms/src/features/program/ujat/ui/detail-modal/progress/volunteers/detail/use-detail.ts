/**
 * UJAT 교육 진행 · 봉사자 상세 — 승인 봉사 신청 목록에서 hydrate
 */

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import {
  getUjatEducationProgressVolunteerDetail,
  type UjatEducationProgressVolunteerDetail,
} from '@/features/program/ujat/ui/detail-modal/progress/volunteers/detail/volunteer-detail-data'
import type { UjatEducationProgressVolunteerRow } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import { UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import { getUjatEducationRegionLabel, findUjatEducationRegionKeyByLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'

function recruitHalfFromProgress(half: EducationProgressHalfKey): UjatVolunteerRecruitHalf {
  return half === 'h2' ? 'h2' : 'h1'
}

function mapApplicantToProgressRow(
  applicant: UjatVolunteerApplicantRow,
  index: number
): UjatEducationProgressVolunteerRow {
  const regionKey = (findUjatEducationRegionKeyByLabel(applicant.preferredRegion.trim()) ??
    (applicant.preferredRegion.trim() || '서울')) as UjatInstitutionApplicationRegionKey
  const grade = (
    UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS as readonly string[]
  ).includes(applicant.grade)
    ? (applicant.grade as UjatEducationProgressVolunteerRow['grade'])
    : '1학년'
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
    totalAssignmentDays: null,
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

  const detail = useMemo((): UjatEducationProgressVolunteerDetail | null => {
    if (remoteEnabled) {
      const applicants = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
      const applicantIndex = applicants.findIndex(row => row.id === volunteerId)
      if (applicantIndex < 0) return null
      const applicant = applicants[applicantIndex]!
      return {
        volunteerId,
        half,
        row: mapApplicantToProgressRow(applicant, applicantIndex),
        applicant,
        adminComment: '',
      }
    }
    return getUjatEducationProgressVolunteerDetail(programId, half, volunteerId)
  }, [half, programId, remoteEnabled, remoteQuery.data, volunteerId])

  return {
    detail,
    loading: remoteEnabled ? remoteQuery.isLoading || remoteQuery.isFetching : false,
  }
}
