/**
 * access token 만료·무효로 refresh를 시도할 401 오류 코드인지.
 * CMS `isAccessTokenUnauthorizedCode`(apps/cms/src/features/auth/lib/parse-auth-token-response.ts)와 같은 판정.
 */
export function isAccessTokenUnauthorizedCode(code: string | undefined): boolean {
  if (!code) return false
  const upper = code.toUpperCase()
  return upper === 'UNAUTHORIZED' || upper === 'TOKEN_EXPIRED' || upper === 'ACCESS_TOKEN_EXPIRED'
}
