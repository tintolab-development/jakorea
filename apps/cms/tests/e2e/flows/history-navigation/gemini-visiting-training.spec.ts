import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { historyIdx, historyLength, expectSearchParams, type ClickTargetElement, expectDeepLinkReplaced } from '../../helpers/history-stack'
import { GeminiVisitingTrainingPage } from '../../pages/gemini-visiting-training.page'
/* ── spec 로컬 유틸 (공용 helper 수정 금지 → 통합 시 helpers 로 승격 제안) ── */
const DATA_ROW = 'tbody.ant-table-tbody tr.ant-table-row'
const EMPTY = '.ant-empty, .ant-table-placeholder'

/** 읽기 전용 데이터 부재가 **증명된** 경우에만 사용 (UI 미발견에는 사용 금지) */
function noteDataAbsent(description: string) {
  test.info().annotations.push({ type: 'note', description: `NOT EXECUTED — ${description}` })
}

async function expectIdx(page: Page, expected: number) {
  await expect.poll(() => historyIdx(page), { timeout: 15_000 }).toBe(expected)
}

/** 테이블에 데이터 행이 있으면 true, 빈 상태(ant-empty)가 보이면 false. 둘 다 없으면 실패 */
async function hasDataRow(scope: ReturnType<Page['locator']>): Promise<boolean> {
  const row = scope.locator(DATA_ROW).first()
  const empty = scope.locator(EMPTY).first()
  await expect(row.or(empty)).toBeVisible({ timeout: 30_000 })
  // antd 표는 로딩 중에도 빈 상태 영역을 먼저 그린다 → 로딩이 끝난 뒤에만 판단
  await expect(scope.locator('.ant-spin-spinning')).toHaveCount(0, { timeout: 30_000 })
  try {
    await row.waitFor({ state: 'visible', timeout: 3_000 })
    return true
  } catch {
    // 로딩 완료 후에도 행이 없고 빈 상태가 유지될 때만 데이터 없음
    await expect(empty).toBeVisible()
    return false
  }
}

function activeTop(nav: ReturnType<Page['locator']>) {
  return nav.locator('.detail-fullpage-modal__lnb-item--active')
}
function lnbItemByLabel(nav: ReturnType<Page['locator']>, label: string) {
  return nav.locator('.detail-fullpage-modal__lnb-item').filter({
    has: nav.page().locator('.detail-fullpage-modal__lnb-item-label').getByText(label, { exact: true }),
  }).first()
}

/**
 * 같은 틱 X 두 번: capture 리스너로 click 이벤트 수를 세고, 한 evaluate(동기 태스크) 안에서
 * 두 번 dispatch. 반환값이 2가 아니면 전제 실패로 FAIL.
 */
async function doubleClickSameTick(button: ReturnType<Page['locator']>): Promise<number> {
  return button.evaluate((el: ClickTargetElement) => {
    let count = 0
    const counter = () => { count += 1 }
    el.addEventListener('click', counter, { capture: true })
    el.click()
    el.click()
    el.removeEventListener('click', counter, { capture: true })
    return count
  })
}

test.use({ trace: 'off', video: 'off', screenshot: 'off' })

/**
 * 제미나이 방문연수 — /programs/gemini/visiting-training
 * 실코드: recruitmentId (lib/recruitment/detail-url.ts GEMINI_RECRUITMENT_ID_PARAM),
 * approvedTrainingId / approvedLnb / approvedInstructorApplicationId (lib/approved/detail-url.ts).
 * 승인 연수 LNB (ui/approved/detail-fullpage-modal.tsx): info '프로그램 정보' / instructors '강사 신청 목록' / managers '담당자 정보'
 * nav: '찾아가는 연수 상세 메뉴'(모집) / '승인 연수 상세 메뉴'(승인). 강사 신청 행 onRow → onOpenApplicationDetail.
 * 허용 goto: test별 주석 (GeminiVisitingTrainingPage.gotoList 가 goto 1회 수행)
 */
const LIST_PATH = '/programs/gemini/visiting-training'
const recruitNav = (page: Page) => page.getByRole('navigation', { name: '찾아가는 연수 상세 메뉴' })
const approvedNav = (page: Page) => page.getByRole('navigation', { name: '승인 연수 상세 메뉴' })
const closeButton = (page: Page) => page.getByRole('dialog').getByRole('button', { name: '닫기' }).first()

async function openList(page: Page, tab: 'recruitment' | 'approved'): Promise<number | null> {
  const g = new GeminiVisitingTrainingPage(page)
  await g.gotoList(tab)
  await g.expectListShell(tab)
  if (!(await hasDataRow(page.locator('body')))) return null
  return historyIdx(page)
}

async function openRecruitment(page: Page, listIdx: number) {
  await page.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(/[?&]recruitmentId=/, { timeout: 30_000 })
  await expectIdx(page, listIdx + 1)
  await expect(recruitNav(page)).toBeVisible({ timeout: 60_000 })
}

async function openApproved(page: Page, listIdx: number) {
  await page.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(/[?&]approvedTrainingId=/, { timeout: 30_000 })
  await expectIdx(page, listIdx + 1)
  await expect(approvedNav(page)).toBeVisible({ timeout: 60_000 })
}

test.describe('history — 제미나이 방문연수', () => {
  // goto 1회: gotoList('recruitment')
  test('모집 상세 recruitmentId push → X는 목록 엔트리로 뒤로(length 불변) → forward 시 상세 복원', async ({ page }) => {
    test.setTimeout(150_000)
    const listIdx = await openList(page, 'recruitment')
    if (listIdx == null) return noteDataAbsent('모집 공고 행 없음(빈 상태 확인)')
    await openRecruitment(page, listIdx)
    await expect(activeTop(recruitNav(page))).toHaveCount(1)
    const active = (await activeTop(recruitNav(page)).innerText()).trim()
    const detailUrl = page.url()
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]recruitmentId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    await expectSearchParams(page, { recruitmentId: null })
    await expect(recruitNav(page)).toBeHidden({ timeout: 15_000 })
    expect(await historyLength(page)).toBe(len)
    await page.goForward()
    await expect(page).toHaveURL(detailUrl, { timeout: 15_000 })
    await expectIdx(page, listIdx + 1)
    await expect(activeTop(recruitNav(page))).toHaveText(active)
  })

  // goto 2회: (1) gotoList — recruitmentId 수집 후 X, (2) 모집 상세 딥링크
  test('모집 상세 딥링크 X — replace(idx·length 불변), goBack 해도 상세 재등장 없음', async ({ page, context }) => {
    test.setTimeout(150_000)
    const discovery = await context.newPage()
    let id: string | null = null
    try {
      const seedIdx = await openList(discovery, 'recruitment')
      if (seedIdx == null) return noteDataAbsent('모집 공고 행 없음(빈 상태 확인)')
      await openRecruitment(discovery, seedIdx)
      id = new URL(discovery.url()).searchParams.get('recruitmentId')
    } finally { await discovery.close() }
    expect(id).toBeTruthy()
    const priorUrl = page.url() // 새 탭 — 딥링크 직전 엔트리(about:blank)
    await page.goto(`${LIST_PATH}?recruitmentId=${encodeURIComponent(id!)}`)
    await expect(recruitNav(page)).toBeVisible({ timeout: 60_000 })
    const deepIdx = await historyIdx(page)
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]recruitmentId=/, { timeout: 15_000 })
    await expectIdx(page, deepIdx)
    expect(await historyLength(page)).toBe(len)
    await expectDeepLinkReplaced(page, { priorUrl, detailKeys: ['recruitmentId'], replacedIdx: deepIdx })
    await expect(recruitNav(page)).toBeHidden({ timeout: 15_000 })
  })

  // goto 1회
  test('모집 상세 같은 틱 X 두 번(이벤트 2회 확인) — idx가 목록보다 작아지지 않음', async ({ page }) => {
    test.setTimeout(120_000)
    const listIdx = await openList(page, 'recruitment')
    if (listIdx == null) return noteDataAbsent('모집 공고 행 없음(빈 상태 확인)')
    await openRecruitment(page, listIdx)
    expect(await doubleClickSameTick(closeButton(page))).toBe(2)
    await expect(page).not.toHaveURL(/[?&]recruitmentId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
  })

  // goto 1회: gotoList('approved')
  test('승인 연수 approvedLnb 변경 push, 같은 LNB 재클릭은 엔트리 없음, goBack 시 URL·활성 LNB 복원', async ({ page }) => {
    test.setTimeout(150_000)
    const listIdx = await openList(page, 'approved')
    if (listIdx == null) return noteDataAbsent('승인 연수 행 없음(빈 상태 확인)')
    await openApproved(page, listIdx)
    const n = approvedNav(page)
    const firstLnb = new URL(page.url()).searchParams.get('approvedLnb')
    const initialActive = (await activeTop(n).innerText()).trim()
    const managers = lnbItemByLabel(n, '담당자 정보')
    await expect(managers).toBeVisible()
    await managers.click()
    await expect(page).toHaveURL(/[?&]approvedLnb=managers/, { timeout: 15_000 })
    await expectIdx(page, listIdx + 2)
    await expect(activeTop(n)).toContainText('담당자 정보')
    const len = await historyLength(page)
    await managers.click()
    await expectSearchParams(page, { approvedLnb: 'managers' })
    await expectIdx(page, listIdx + 2)
    expect(await historyLength(page)).toBe(len)
    await page.goBack()
    await expect(page).not.toHaveURL(/[?&]approvedLnb=managers/, { timeout: 15_000 })
    await expectIdx(page, listIdx + 1)
    await expectSearchParams(page, { approvedLnb: firstLnb })
    await expect(activeTop(n)).toHaveText(initialActive)
  })

  // goto 1회: gotoList('approved')
  test('강사 신청 중첩 X — 중첩만 닫고 강사 신청 목록 엔트리로 뒤로(모달 유지), 다시 X는 목록(listIdx)', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openList(page, 'approved')
    if (listIdx == null) return noteDataAbsent('승인 연수 행 없음(빈 상태 확인)')
    await openApproved(page, listIdx)
    const n = approvedNav(page)
    const instructors = lnbItemByLabel(n, '강사 신청 목록')
    await expect(instructors).toBeVisible()
    await instructors.click()
    await expect(page).toHaveURL(/[?&]approvedLnb=instructors/, { timeout: 15_000 })
    await expect(activeTop(n)).toContainText('강사 신청 목록')
    const instructorListIdx = await historyIdx(page)
    const dialog = page.getByRole('dialog').first()
    if (!(await hasDataRow(dialog))) return noteDataAbsent('강사 신청 행 없음(빈 상태 확인)')
    await dialog.locator(DATA_ROW).first().click()
    await expect(page).toHaveURL(/[?&]approvedInstructorApplicationId=/, { timeout: 30_000 })
    await expectIdx(page, instructorListIdx + 1)
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]approvedInstructorApplicationId=/, { timeout: 15_000 })
    await expectIdx(page, instructorListIdx)
    await expectSearchParams(page, { approvedLnb: 'instructors' })
    await expect(page).toHaveURL(/[?&]approvedTrainingId=/)
    await expect(n).toBeVisible()
    await expect(activeTop(n)).toContainText('강사 신청 목록')
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]approvedTrainingId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    await expect(n).toBeHidden({ timeout: 15_000 })
    expect(await historyLength(page)).toBe(len)
  })
})
