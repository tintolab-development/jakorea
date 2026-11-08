import { findSponsoredProgram } from '../../helpers/program-history-readonly'
import { test, expect } from '../../fixtures/test'
import { SponsorManagementPage } from '../../pages/sponsor-management.page'
import { HistoryNavigationPage } from '../../pages/history-navigation.page'
import { historyIdx, historyLength } from '../../helpers/history-stack'

test.use({ trace: 'off', video: 'off', screenshot: 'off' })
const route = '/sponsor'
const keys = ['sponsorId', 'sponsorLnb', 'returnTo']

test('후원사 LNB push·동일 메뉴 무증가 → back 활성 LNB 동기화 → X 목록 back·forward', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  const sponsor = new SponsorManagementPage(page)
  await nav.gotoList()
  if (!await nav.hasRows()) return
  const idx = await historyIdx(page)
  await nav.open()
  const detail = page.url()
  await nav.expectIdx(idx + 1)
  await sponsor.clickLnb('프로그램 후원 이력')
  await sponsor.expectLnbUrl('sponsor-programs')
  await nav.expectIdx(idx + 2)
  // The POM waits for a GET on changed LNB; same-menu click deliberately bypasses that wait.
  const selected = sponsor.detailDialog().getByRole('button', { name: '프로그램 후원 이력', exact: true })
  const length = await historyLength(page)
  await selected.click()
  await sponsor.expectLnbUrl('sponsor-programs')
  await nav.expectIdx(idx + 2)
  expect(await historyLength(page)).toBe(length)
  await page.goBack()
  await expect(page).toHaveURL(detail)
  await nav.expectIdx(idx + 1)
  await expect(sponsor.detailDialog().locator('.detail-fullpage-modal__lnb-item--active')).toHaveText('후원사 상세 정보')
  await nav.closeToList(idx)
  await page.goForward()
  await expect(page).toHaveURL(detail)
  await nav.expectIdx(idx + 1)
  await expect(sponsor.detailDialog()).toBeVisible()
})

test('후원사 같은 틱 X 두 번 — 목록보다 뒤로 가지 않음', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  await nav.gotoList()
  if (!await nav.hasRows()) return
  const idx = await historyIdx(page)
  await nav.open()
  await nav.expectIdx(idx + 1)
  await nav.closeToList(idx, true)
})

test('프로그램 후원사 링크 returnTo — X 기존 프로그램 엔트리 back(push 없음)', async ({ page }) => {
  const program = new HistoryNavigationPage(page, '/programs/general', ['programId'])
  await program.gotoList()
  if (!await program.hasRows()) return
  const link = await findSponsoredProgram(page, await historyIdx(page))
  if (!link) return
  const target = page.url()
  const idx = await historyIdx(page)
  await link.click()
  await expect(page).toHaveURL(url => url.searchParams.has('sponsorId') && url.searchParams.has('returnTo'))
  const sponsor = new HistoryNavigationPage(page, route, keys)
  await sponsor.expectIdx(idx + 1)
  const length = await historyLength(page)
  await sponsor.closeButton().click()
  await expect(page).toHaveURL(target)
  await sponsor.expectIdx(idx)
  expect(await historyLength(page)).toBe(length)
})

test('후원사 딥링크 returnTo — 지나온 엔트리 없으면 replace', async ({ page, context }) => {
  const discovery = await context.newPage()
  let detail: string
  try {
    const seed = new HistoryNavigationPage(discovery, route, keys)
    await seed.gotoList()
    if (!await seed.hasRows()) return
    await seed.open()
    detail = discovery.url()
  } finally { await discovery.close() }
  // Explicit synthetic deep-link contract, distinct from the real UI returnTo case above.
  const url = new URL(detail!)
  url.searchParams.set('returnTo', '/programs/general')
  await page.goto(url.href)
  const nav = new HistoryNavigationPage(page, route, keys)
  await expect(nav.modal()).toBeVisible()
  const idx = await historyIdx(page)
  const length = await historyLength(page)
  await nav.closeButton().click()
  await expect(page).toHaveURL(target => target.pathname === '/programs/general' && !target.searchParams.has('sponsorId'))
  await nav.expectIdx(idx)
  expect(await historyLength(page)).toBe(length)
  await page.goBack()
  await expect(page).not.toHaveURL(target => target.searchParams.has('sponsorId'))
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
  await page.goto(detail!)
  await expect(nav.modal()).toBeVisible()
  const idx = await historyIdx(page)
  const length = await historyLength(page)
  await nav.closeToList(idx)
  expect(await historyLength(page)).toBe(length)
  await page.goBack()
  await expect(page).not.toHaveURL(url => Boolean(url.searchParams.get(keys[0])))
  await expect(nav.modal()).toHaveCount(0)
})
