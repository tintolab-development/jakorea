import { useMutation } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { setAuthTokens } from '@/shared/lib/auth-token'
import { queryClient } from '@/shared/lib/query-client'
import { postPortalPasswordChange } from '../api/client'
import { expiresAtFromExpiresInSeconds } from '../api/parse-auth-token'
import type { PasswordChangeRequest } from '../api/types'
import { applyAuthTokenAgeGroupToMeCache } from '../lib/apply-auth-token-age-group'

/**
 * Class G — 로그인 세션 비밀번호 변경.
 * BE가 기존 세션을 폐기하고 새 토큰을 돌려주므로 성공 즉시 저장한다(중복 새 비밀번호 로그인 호출 없음).
 * 저장 시 `platform:dev-auth-change`가 발행돼 세션 훅이 새 sid로 Session GET을 다시 한다.
 */
export function usePortalPasswordChangeMutation() {
  return useMutation({
    mutationFn: (body: PasswordChangeRequest) => postPortalPasswordChange(body),
    retry: false,
    onSuccess: tokens => {
      if (!tokens) return
      queryClient.removeQueries({ queryKey: platformQueryKeys.auth.me() })
      queryClient.removeQueries({ queryKey: platformQueryKeys.auth.memberProfile() })
      setAuthTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAtFromExpiresInSeconds(tokens.expiresInSeconds),
      })
      applyAuthTokenAgeGroupToMeCache(tokens.ageGroup)
    },
  })
}
