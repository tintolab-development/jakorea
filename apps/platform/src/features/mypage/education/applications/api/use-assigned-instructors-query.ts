import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import type { ProgramApplicationType } from './types'
import { fetchAssignedInstructors } from './assigned-instructors'

/**
 * Class D — 교사 회원 배정 강사 동의서.
 * 숫자 신청 id 이고 로그인됐을 때만 조회한다.
 */
export function useAssignedInstructorsQuery(
  applicationId: string | undefined,
  applicationType?: ProgramApplicationType
) {
  const numericId =
    applicationId != null && /^\d+$/.test(applicationId) ? Number(applicationId) : null
  const enabled =
    applicationType === 'ORGANIZATION' &&
    numericId != null &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken())

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.assignedInstructors(numericId ?? 0),
    queryFn: ({ signal }) => fetchAssignedInstructors(numericId!, signal),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

  return { ...query, remoteEnabled: enabled }
}
