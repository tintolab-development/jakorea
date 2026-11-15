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
// CSS 모듈은 updateStyle로 <style>을 주입한다 — no-op이면 화면 스타일이 빠져
// 팝오버 위치가 뷰포트 밖으로 밀린다. HMR reload만 막고 스타일 주입은 유지한다.
const sheets = new Map()
export function updateStyle(id, content) {
  let style = sheets.get(id)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.setAttribute('data-vite-dev-id', id)
    document.head.appendChild(style)
    sheets.set(id, style)
  }
  style.textContent = content
}
export function removeStyle(id) {
  const style = sheets.get(id)
  if (!style) return
  style.remove()
  sheets.delete(id)
}
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
