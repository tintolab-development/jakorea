import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { ProgramApplicationType } from './types'
import {
  fetchAssignedInstructors,
  type AssignedInstructorApplicationType,
} from './assigned-instructors'

/**
 * Class D — 교사 회원 배정 강사 동의서.
 * 숫자 신청 id 이고 로그인됐을 때만 INDIVIDUAL·ORGANIZATION 신청을 조회한다.
 */
export function useAssignedInstructorsQuery(
  applicationId: string | undefined,
  applicationType?: ProgramApplicationType
) {
  const numericId =
    applicationId != null && /^\d+$/.test(applicationId) ? Number(applicationId) : null
  const supportedApplicationType: AssignedInstructorApplicationType | null =
    applicationType === 'INDIVIDUAL' || applicationType === 'ORGANIZATION'
      ? applicationType
      : null
  const enabled =
    supportedApplicationType != null &&
    numericId != null &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken())

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.assignedInstructors(
      supportedApplicationType ?? 'INDIVIDUAL',
      numericId ?? 0,
    ),
    queryFn: ({ signal }) =>
      fetchAssignedInstructors(supportedApplicationType!, numericId!, signal),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
    refetchOnWindowFocus: false,
  })

  return { ...query, remoteEnabled: enabled }
}
