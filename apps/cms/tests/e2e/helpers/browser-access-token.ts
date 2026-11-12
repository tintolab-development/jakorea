import type { BrowserContext, Page, Request } from '@playwright/test'

/**
 * QA-0137 이후 CMS·Platform access token은 화면 메모리에만 있다 (localStorage `auth_token`·`platform_auth_token` 없음).
 * E2E가 API를 직접 부를 때는 화면이 실제로 보낸 `Authorization: Bearer …`를 기록해 그 값을 쓴다.
 * refresh를 E2E가 직접 부르지 않는다 — refresh token이 rotate돼 화면 세션이 재사용 탐지로 끊길 수 있다.
 */

export type BrowserAccessTokenScope = 'cms' | 'platform'

const recordedTokens = new WeakMap<BrowserContext, Partial<Record<BrowserAccessTokenScope, string>>>()

function scopeOfRequest(request: Request): BrowserAccessTokenScope | null {
  let pathname: string
  try {
    pathname = new URL(request.url()).pathname
  } catch {
    return null
  }
  if (pathname.startsWith('/api/admin/')) return 'cms'
  if (
    pathname.startsWith('/api/portal/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/homepage/')
  ) {
    return 'platform'
  }
  return null
}

function bearerOf(request: Request): string | null {
  const header = request.headers()['authorization']
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

/** 컨텍스트의 모든 페이지 요청에서 마지막 Bearer 값을 범위별로 기록한다 (중복 설치 무시) */
export function installAccessTokenRecorder(context: BrowserContext): void {
  if (recordedTokens.has(context)) return
  const tokens: Partial<Record<BrowserAccessTokenScope, string>> = {}
  recordedTokens.set(context, tokens)
  context.on('request', request => {
    const scope = scopeOfRequest(request)
    if (!scope) return
    const token = bearerOf(request)
    if (token) tokens[scope] = token
  })
}

/** 로그인 응답 본문 등에서 얻은 값을 기록한다 (아직 화면이 인증 요청을 보내기 전) */
export function rememberAccessToken(
  context: BrowserContext,
  scope: BrowserAccessTokenScope,
  token: string | null | undefined,
): void {
  installAccessTokenRecorder(context)
  if (token && token.trim()) recordedTokens.get(context)![scope] = token.trim()
}

/**
 * 화면이 마지막으로 보낸 access token. 아직 없으면 다음 인증 요청을 기다린다
 * (새로고침 복원 refresh 직후 첫 API 호출 등). 끝내 없으면 null.
 */
export async function readBrowserAccessToken(
  page: Page,
  scope: BrowserAccessTokenScope,
  options?: { timeoutMs?: number },
): Promise<string | null> {
  const context = page.context()
  installAccessTokenRecorder(context)
  const recorded = recordedTokens.get(context)?.[scope]
  if (recorded) return recorded

  const request = await page
    .waitForRequest(req => scopeOfRequest(req) === scope && bearerOf(req) != null, {
      timeout: options?.timeoutMs ?? 15_000,
    })
    .catch(() => null)
  return (request ? bearerOf(request) : null) ?? recordedTokens.get(context)?.[scope] ?? null
}

/** CMS 관리자 access token — 없으면 명확한 오류 */
export async function requireCmsAccessToken(page: Page, purpose: string): Promise<string> {
  const token = await readBrowserAccessToken(page, 'cms')
  if (!token) throw new Error(`${purpose}에 필요한 CMS 관리자 access token을 화면 요청에서 찾지 못했습니다.`)
  return token
}
