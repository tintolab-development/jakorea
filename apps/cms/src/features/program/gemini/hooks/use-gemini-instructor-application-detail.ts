import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mapInstructorApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { getGeminiInstructorApplicationDetail } from '../api/visiting-training/service'
import { geminiVisitingTrainingQueryKeys } from '../api/visiting-training/query-keys'

function mapGeminiApplicationStatus(status?: string): ApplicantInstructorRow['approvalStatus'] {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['APPROVED', 'APPROVAL_COMPLETED', 'FINAL_SELECTED', 'ASSIGNED'].includes(normalized)) {
    return 'approved'
  }
  if (
    ['REJECTED', 'AUTO_REJECTED', 'CANCELLED', 'CANCELED', 'APPROVAL_CANCELLED'].includes(
      normalized
    )
  ) {
    return 'rejected'
  }
  return 'pending'
}

function createSeedRow(applicationId: string): ApplicantInstructorRow {
  return {
    id: applicationId,
    instructorMemberId: undefined,
    no: 0,
    instructorName: '',
    lectureExperienceYears: 0,
    educationLevel: '',
    educationSchoolName: '',
    contact: '',
    email: '',
    address: '',
    approvalStatus: 'pending',
    applicationStatus: undefined,
    schoolName: '',
  }
}

export function useGeminiInstructorApplicationDetail(
  approvedTrainingId: string,
  applicationId: string | null
): {
  row: ApplicantInstructorRow | null
  isLoading: boolean
  isError: boolean
  error: unknown
} {
  const query = useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.approvedInstructorApplicationDetail(
      approvedTrainingId,
      applicationId ?? ''
    ),
    queryFn: () => getGeminiInstructorApplicationDetail(applicationId!),
    // 서비스 계층에서 remote API 설정 누락을 명시적인 오류로 반환한다.
    // 비활성화된 query를 pending 상태로 남겨 상세 화면이 영구 로딩되지 않게 한다.
    enabled: Boolean(applicationId),
    staleTime: 30_000,
    retry: false,
  })

  const row = useMemo(() => {
    if (!applicationId || !query.data) return null
    const seed = createSeedRow(applicationId)
    const mapped = mapInstructorApplicationDetailToApplicantRow(query.data, seed)
    return {
      ...mapped,
      approvalStatus: mapGeminiApplicationStatus(query.data.applicationStatus),
      applicationStatus: query.data.applicationStatus,
    }
  }, [applicationId, query.data])

  return {
    row,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
  }
}
