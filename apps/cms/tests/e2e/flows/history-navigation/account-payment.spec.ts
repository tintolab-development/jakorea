import { test, expect } from '../../fixtures/test'
import { HistoryNavigationPage } from '../../pages/history-navigation.page'
import { historyIdx, historyLength, expectDeepLinkReplaced } from '../../helpers/history-stack'

test.use({ trace: 'off', video: 'off', screenshot: 'off' })
const route = '/settlement-management/account-payments'
const keys = ['ap_detail']

test('상세 열기 push → X 목록 back → 앞으로가기 상세 복원(push 없음)', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  await nav.gotoList()
  if (!await nav.hasRows()) return
  const listIdx = await historyIdx(page)
  await nav.open()
  const detail = page.url()
  await nav.expectIdx(listIdx + 1)
  await nav.closeToList(listIdx)
  await page.goForward()
  await expect(page).toHaveURL(detail)
  await nav.expectIdx(listIdx + 1)
  await expect(nav.modal()).toBeVisible()
})

test('같은 틱 X 두 번 — 목록보다 뒤로 가지 않고 forward 보존', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  await nav.gotoList()
  if (!await nav.hasRows()) return
  const listIdx = await historyIdx(page)
  await nav.open()
  const detail = page.url()
  await nav.expectIdx(listIdx + 1)
  await nav.closeToList(listIdx, true)
  await page.goForward()
  await expect(page).toHaveURL(detail)
  await nav.expectIdx(listIdx + 1)
})

test('딥링크 X — 목록 replace, 뒤로가도 상세가 다시 열리지 않음', async ({ page, context }) => {
  // Discover a real seed in another tab; tested tab has no ancestor list entry.
  const discovery = await context.newPage()
  let detail: string
  try {
    const seed = new HistoryNavigationPage(discovery, route, keys)
    await seed.gotoList()
    if (!await seed.hasRows()) return
    await seed.open()
    detail = discovery.url()
  } finally { await discovery.close() }
  const nav = new HistoryNavigationPage(page, route, keys)
  const priorUrl = page.url() // 새 탭 — 딥링크 직전 엔트리(about:blank)
  await page.goto(detail!)
  await expect(nav.modal()).toBeVisible()
  const idx = await historyIdx(page)
  const length = await historyLength(page)
  await nav.closeToList(idx)
  expect(await historyLength(page)).toBe(length)
  await expectDeepLinkReplaced(page, { priorUrl, detailKeys: keys, replacedIdx: idx })
  await expect(nav.modal()).toHaveCount(0)
})
