import type { Page } from '@playwright/test'

/**
 * Dedicated backend를 사용하는 E2E에서만 브라우저 API 요청을 우회한다.
 * 제품 런타임에서는 E2E_API_PROXY_TARGET이 없으므로 아무 동작도 하지 않는다.
 */
export async function installE2eApiProxy(page: Page): Promise<void> {
  const targetOrigin = process.env.E2E_API_PROXY_TARGET?.replace(/\/$/, '')
  if (!targetOrigin) return

  await page.route('**/*', async route => {
    const requestUrl = new URL(route.request().url())
    if (!requestUrl.pathname.startsWith('/api/')) {
      await route.continue()
      return
    }
    const targetUrl = `${targetOrigin}${requestUrl.pathname}${requestUrl.search}`
    await route.continue({ url: targetUrl })
  })
}
