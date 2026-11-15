/**
 * describe beforeAll 에서 storageState 세션으로 페이지를 연다.
 * `browser.newPage()`  alone 는 project storageState 를 쓰지 않는다.
 */

import { type Browser, type Page } from '@playwright/test'
import { E2E_ADMIN_AUTH_FILE } from './auth-paths'
import { installE2eApiProxy } from './e2e-api-proxy'
import { installAccessTokenRecorder } from './browser-access-token'

export async function withAuthenticatedPage<T>(
  browser: Browser,
  run: (page: Page) => Promise<T>
): Promise<T> {
  const context = await browser.newContext({ storageState: E2E_ADMIN_AUTH_FILE })
  // QA-0137: access token은 화면 메모리에만 있다 — 첫 요청부터 Bearer 값을 기록한다
  installAccessTokenRecorder(context)
  const page = await context.newPage()
  await installE2eApiProxy(page)
  try {
    return await run(page)
  } finally {
    // refresh token은 사용 시 rotate된다. 닫기 전에 최신 세션을 저장해 두지 않으면
    // 다음 컨텍스트가 이미 쓴 refresh token으로 복원하다 세션을 잃는다(화면 요청에 Bearer 없음).
    await context.storageState({ path: E2E_ADMIN_AUTH_FILE }).catch(() => undefined)
    await context.close().catch(() => undefined)
  }
}
