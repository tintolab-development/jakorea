import type { Page } from '@playwright/test'
import { expect } from '../fixtures/test'

/**
 * e2e 타입 검사(tsconfig.node.json)는 DOM lib이 없다.
 * 브라우저 콜백 안에서 쓰는 멤버만 구조 타입으로 표현한다(콜백은 직렬화되므로 타입만 참조).
 */
export type BrowserHistoryGlobal = { history: { state: unknown; length: number } }

/** 같은 틱 이중 클릭 콜백에서 쓰는 요소 멤버 */
export type ClickTargetElement = {
  addEventListener(type: 'click', listener: () => void, options: { capture: boolean }): void
  removeEventListener(type: 'click', listener: () => void, options: { capture: boolean }): void
  click(): void
}

export async function historyIdx(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      ((globalThis as unknown as BrowserHistoryGlobal).history.state as { idx?: number } | null)
        ?.idx ?? -1
  )
}
export async function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => (globalThis as unknown as BrowserHistoryGlobal).history.length)
}
/**
 * 딥링크 replace 검증.
 * 딥링크로 시작한 탭의 직전 엔트리는 목록이 아니다(새 탭이면 about:blank). 그래서
 * 1) 뒤로가기 → 딥링크 직전 URL(priorUrl) 그대로인지,
 * 2) 앞으로가기 → replace된 엔트리가 상세가 아니라 목록(상세 쿼리 없음, idx 동일)인지 확인한다.
 * 2)에서 상세 쿼리가 다시 보이면 닫기가 replace 하지 않은 것이다.
 */
export async function expectDeepLinkReplaced(
  page: Page,
  input: { priorUrl: string; detailKeys: readonly string[]; replacedIdx: number }
): Promise<void> {
  await page.goBack()
  await expect(page).toHaveURL(input.priorUrl)
  await page.goForward()
  await expect(page).toHaveURL(url => input.detailKeys.every(key => !url.searchParams.has(key)))
  await expect.poll(() => historyIdx(page)).toBe(input.replacedIdx)
}

/** null means the parameter must be absent (not an empty string). */
export async function expectSearchParams(page: Page, expected: Record<string, string | null>): Promise<void> {
  await expect(page).toHaveURL(url => Object.entries(expected).every(([key, value]) => url.searchParams.get(key) === value))
}
