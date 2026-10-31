import { useQuery } from '@tanstack/react-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import type { EducationProgressHalfKey } from '../../tabs'
import { loadInstitutionAssignmentSources } from './institution-assignment-data'

/**
 * 기관 배정 탭 조회.
 * Class E: 출결 담당·학급 배정은 진행 중 바뀌므로 staleTime 30초.
 * 로그아웃 캐시는 기존 CMS query client 경계를 따른다.
 */
export function useInstitutionAssignmentSources(input: {
  programId: string
  institutionId: string
  half: EducationProgressHalfKey
}) {
  const organizationApplicationId = Number(input.institutionId)
  const remoteEnabled =
    shouldUseUjatApplicationsRemoteApi() &&
    Boolean(input.programId) &&
    Number.isFinite(organizationApplicationId)
  const semesterType = toUjatRecruitHalfApi(input.half)

  const query = useQuery({
    queryKey: ujatQueryKeys.institutionAssignment(
      input.programId,
      input.institutionId,
      semesterType
    ),
    enabled: remoteEnabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () =>
      loadInstitutionAssignmentSources({
        programId: input.programId,
        organizationApplicationId,
        semesterType,
      }),
  })

  return {
    sources: query.data ?? null,
    isLoading: remoteEnabled && query.isLoading,
    isRemote: remoteEnabled,
  }
}
