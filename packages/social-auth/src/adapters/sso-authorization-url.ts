/**
 * 백엔드 SSO start 응답 authorizationUrl의 redirect_uri를 canonical callback으로 보정합니다.
 * 백엔드 public URL이 localhost:8080으로 설정되면 IdP redirect_uri가 잘못될 수 있습니다.
 */
export function rewriteOAuthAuthorizationRedirectUri(
  authorizationUrl: string,
  expectedRedirectUri: string
): string {
  try {
    const url = new URL(authorizationUrl)
    const currentRedirectUri = url.searchParams.get('redirect_uri')
    if (!currentRedirectUri || currentRedirectUri === expectedRedirectUri) {
      return authorizationUrl
    }

    const expected = new URL(expectedRedirectUri)
    const current = new URL(currentRedirectUri)

    const hostMismatch = current.host !== expected.host
    const pathMismatch = current.pathname !== expected.pathname
    const isLocalBackendHost =
      current.hostname === 'localhost' || current.hostname === '127.0.0.1'

    if (hostMismatch || pathMismatch || isLocalBackendHost) {
      url.searchParams.set('redirect_uri', expectedRedirectUri)
      return url.toString()
    }
  } catch {
    return authorizationUrl
  }

  return authorizationUrl
}
