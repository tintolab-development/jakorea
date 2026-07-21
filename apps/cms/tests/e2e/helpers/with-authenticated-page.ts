/**
 * describe beforeAll 에서 storageState 세션으로 페이지를 연다.
 * `browser.newPage()`  alone 는 project storageState 를 쓰지 않는다.
 */

import { type Browser, type Page } from '@playwright/test'
import { E2E_ADMIN_AUTH_FILE } from './auth-paths'

export async function withAuthenticatedPage<T>(
  browser: Browser,
  run: (page: Page) => Promise<T>
): Promise<T> {
  const context = await browser.newContext({ storageState: E2E_ADMIN_AUTH_FILE })
  const page = await context.newPage()
  try {
    return await run(page)
  } finally {
    await context.close()
  }
}
