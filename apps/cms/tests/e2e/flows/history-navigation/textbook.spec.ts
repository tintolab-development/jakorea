import { test, expect } from '../../fixtures/test'
import { TextbookManagementPage } from '../../pages/textbook-management.page'
import { HistoryNavigationPage } from '../../pages/history-navigation.page'
import { expectSearchParams, historyIdx, historyLength } from '../../helpers/history-stack'

test.use({ trace: 'off', video: 'off', screenshot: 'off' })
const route = '/textbook'
const keys = ['textbookId', 'textbookMode']

test('교재 view push → edit push → 취소 view back → X 목록 back', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  const textbook = new TextbookManagementPage(page)
  await nav.gotoList()
  if (!await nav.hasRows()) return
  const listIdx = await historyIdx(page)
  await nav.open()
  const id = new URL(page.url()).searchParams.get('textbookId')!
  await expectSearchParams(page, { textbookId: id, textbookMode: 'view' })
  await nav.expectIdx(listIdx + 1)
  await textbook.detailDialog().getByRole('button', { name: '정보 수정', exact: true }).click()
  await expectSearchParams(page, { textbookId: id, textbookMode: 'edit' })
  await nav.expectIdx(listIdx + 2)
  const length = await historyLength(page)
  await textbook.detailDialog().getByRole('button', { name: '취소', exact: true }).click()
  await expectSearchParams(page, { textbookId: id, textbookMode: 'view' })
  await nav.expectIdx(listIdx + 1)
  expect(await historyLength(page)).toBe(length)
  await nav.closeToList(listIdx)
  await page.goForward()
  await expectSearchParams(page, { textbookId: id, textbookMode: 'view' })
  await nav.expectIdx(listIdx + 1)
})

test('A 닫고 다른 교재 B 열기 — 목록에서 push(+1), back 아님', async ({ page }) => {
  const nav = new HistoryNavigationPage(page, route, keys)
  await nav.gotoList()
  if (!await nav.hasRows(2)) return
  const idx = await historyIdx(page)
  await nav.open()
  const a = new URL(page.url()).searchParams.get('textbookId')
  await nav.expectIdx(idx + 1)
  await nav.closeToList(idx)
  await nav.open(1)
  await expect(page).toHaveURL(url => Boolean(url.searchParams.get('textbookId')) && url.searchParams.get('textbookId') !== a)
  await nav.expectIdx(idx + 1)
})

test('교재 저장 후 view — 격리 데이터에서만 back 검증', async () => {
  test.skip(!process.env.E2E_ALLOW_MUTATION, '기본 읽기 전용 실행: 저장 금지')
  test.skip(true, '격리 교재 fixture가 제공되지 않아 저장 경로 미실행; 일반 시드 변경 금지')
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
