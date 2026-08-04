import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getSignupTerms } from '../client'

type UseSignupTermsParams = {
  memberType: 'GENERAL' | 'TEACHER' | null
  /** API `date` — YYYY-MM-DD */
  birthDateIso: string | null
  enabled?: boolean
}

/** Class A-ish reference catalog — longer staleTime */
export function useSignupTermsQuery({
  memberType,
  birthDateIso,
  enabled = true,
}: UseSignupTermsParams) {
  const remote = isRemoteApiConfigured()
  const canFetch = remote && enabled && Boolean(memberType && birthDateIso)

  return useQuery({
    queryKey: platformQueryKeys.auth.signupTerms(memberType ?? '', birthDateIso ?? ''),
    queryFn: () =>
      getSignupTerms({
        memberType: memberType!,
        birthDate: birthDateIso!,
      }),
    enabled: canFetch,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
