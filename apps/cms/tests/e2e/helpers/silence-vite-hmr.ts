import type { Page } from '@playwright/test'

/**
 * Vite dev HMR는 다른 세션의 파일 저장만으로 full reload를 일으킨다.
 * E2E 브라우저에서만 HMR 클라이언트를 no-op 스텁으로 바꿔
 * 로그인·등록 중 페이지가 반복 reload 되지 않게 한다.
 * 앱 소스/Vite 설정은 변경하지 않는다.
 *
 * 기본값은 적용하지 않는다. `E2E_STABLE_VITE_NAV=1` 일 때만 호출한다.
 */
export function isE2eStableViteNavEnabled() {
  return process.env.E2E_STABLE_VITE_NAV === '1'
}

const VITE_CLIENT_STUB = `
export function createHotContext() {
  return {
    accept() {},
    acceptDeps() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
    data: {},
  }
}
export function updateStyle() {}
export function removeStyle() {}
export function injectQuery(url) { return url }
`

export async function silenceViteHmr(page: Page) {
  await page.route('**/@vite/client*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      headers: { 'Cache-Control': 'no-store' },
      body: VITE_CLIENT_STUB,
    })
  })
}
