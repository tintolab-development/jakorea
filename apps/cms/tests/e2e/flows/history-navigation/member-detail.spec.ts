import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { historyIdx, historyLength, expectSearchParams } from '../../helpers/history-stack'
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
  return row.isVisible()
}

function activeTop(nav: ReturnType<Page['locator']>) {
  return nav.locator('.detail-fullpage-modal__lnb-item--active')
}
function activeChild(nav: ReturnType<Page['locator']>) {
  return nav.locator('.detail-fullpage-modal__lnb-child--active')
}

/**
 * 같은 틱 X 두 번: capture 리스너로 click 이벤트 수를 세고, 한 evaluate(동기 태스크) 안에서
 * 두 번 dispatch. 반환값이 2가 아니면 전제 실패로 FAIL.
 */
async function doubleClickSameTick(button: ReturnType<Page['locator']>): Promise<number> {
  return button.evaluate((el: HTMLElement) => {
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
 * 회원 상세 — /users/list?kind=all
 * 실코드: id, lnb('detail-info' 기본, 'history'), programsChild(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
 * pages/users/user-detail-fullpage-modal.tsx). 사이드바 shared/ui/detail-modal-sidebar.tsx(활성 클래스 --active),
 * nav 이름은 역할별(userDetailSidebarNavAriaLabel: '학교 상세 메뉴' 등) → dialog 안 nav.detail-fullpage-modal__lnb 로 지정.
 * 소속 교사: detail-info 탭의 SchoolAffiliatedTeachersSection('소속 교사 목록', linkedUserId 행 클릭 → 교사 상세).
 * ⚠ 학교(SCHOOL)는 kind=all 에 포함되지 않음(map-roles-exact-any-of.ts "학교 조직 옵션 없음") → 학교 케이스만 kind=institutions.
 * 오픈 대기: member-detail-single-click-open.spec.ts 처럼 [?&]id= URL 반영 후 조작.
 */
const LIST = '/users/list?kind=all'
const dialog = (page: Page) => page.getByRole('dialog').first()
const lnb = (page: Page) => dialog(page).locator('nav.detail-fullpage-modal__lnb')
const closeButton = (page: Page) => dialog(page).getByRole('button', { name: '닫기' }).first()
const param = (page: Page, k: string) => new URL(page.url()).searchParams.get(k)

async function openList(page: Page, url = LIST): Promise<number | null> {
  await page.goto(url)
  if (!(await hasDataRow(page.locator('body')))) return null
  return historyIdx(page)
}
async function openRow(page: Page, listIdx: number) {
  await page.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(/[?&]id=/, { timeout: 15_000 })
  await expect(dialog(page)).toBeVisible({ timeout: 30_000 })
  await expect(lnb(page)).toBeVisible({ timeout: 30_000 })
  await expectIdx(page, listIdx + 1)
}

test.describe('history — 회원 상세', () => {
  // goto 1회
  test('상세 push, LNB 변경 push·재클릭 고정, goBack 시 URL·활성 LNB 복원, X는 listIdx(length 불변), forward 시 상세 복원', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openList(page)
    if (listIdx == null) return noteDataAbsent('회원 목록 행 없음(빈 상태 확인)')
    await openRow(page, listIdx)
    const n = lnb(page)
    await expect(activeTop(n)).toHaveCount(1)
    const initialActive = (await activeTop(n).innerText()).trim()
    const initialLnb = param(page, 'lnb')
    const candidates = n.locator('.detail-fullpage-modal__lnb-item:not(.detail-fullpage-modal__lnb-item--active)')
    let otherLabel: string | null = null
    for (let index = 0; index < await candidates.count(); index++) {
      const item = candidates.nth(index)
      const label = (await item.locator('.detail-fullpage-modal__lnb-item-label').innerText()).trim()
      let knownPreparationAlert = false
      let unexpectedDialog = false
      let dismissed: Promise<void> | undefined
      const handleDialog = (dialog: import('@playwright/test').Dialog) => {
        knownPreparationAlert = dialog.type() === 'alert' && dialog.message() === '준비 중입니다.'
        unexpectedDialog = !knownPreparationAlert
        dismissed = dialog.dismiss()
      }
      page.on('dialog', handleDialog)
      try { await item.click(); await dismissed } finally { page.off('dialog', handleDialog) }
      expect(unexpectedDialog, '예상하지 않은 대화상자 발생(원문 미기록)').toBe(false)
      if (knownPreparationAlert) {
        await expectSearchParams(page, { lnb: initialLnb })
        await expectIdx(page, listIdx + 1)
        continue
      }
      otherLabel = label
      break
    }
    if (!otherLabel) return noteDataAbsent('선택 회원 역할의 모든 비활성 LNB가 준비 중 안내 — push 가능한 메뉴 미구현')
    await expect.poll(() => param(page, 'lnb')).not.toBe(initialLnb)
    await expectIdx(page, listIdx + 2)
    await expect(activeTop(n)).toContainText(otherLabel)
    const changedUrl = page.url()
    const len = await historyLength(page)
    await activeTop(n).click() // 재클릭
    await expect(page).toHaveURL(changedUrl)
    await expectIdx(page, listIdx + 2)
    expect(await historyLength(page)).toBe(len)
    await page.goBack()
    await expect.poll(() => param(page, 'lnb')).toBe(initialLnb)
    await expectIdx(page, listIdx + 1)
    await expect(activeTop(n)).toHaveText(initialActive)

    const detailUrl = page.url()
    const lenBeforeClose = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]id=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    await expectSearchParams(page, { id: null, lnb: null, programsChild: null })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await historyLength(page)).toBe(lenBeforeClose)
    await page.goForward()
    await expect(page).toHaveURL(detailUrl, { timeout: 15_000 })
    await expectIdx(page, listIdx + 1)
    await expect(activeTop(lnb(page))).toHaveText(initialActive)
  })

  // goto 1회. 하위 메뉴는 역할별 생성(programsHistoryHasChildMenu) — 하위 메뉴 2개 이상인 회원(시드 '김개인') 사용
  test('참여 이력 하위 메뉴(programsChild) 변경 push·재클릭 고정, goBack 시 활성 하위 메뉴 복원', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto(LIST)
    await page.getByPlaceholder('회원명을 입력해 주세요').fill('김개인')
    await page.getByRole('button', { name: '조회' }).click()
    if (!(await hasDataRow(page.locator('body')))) return noteDataAbsent("회원 '김개인' 시드 없음(빈 상태 확인)")
    const listIdx = await historyIdx(page)
    await openRow(page, listIdx)
    const n = lnb(page)
    await page.getByText(/^(프로젝트|프로그램) 참여 이력$/).first().click()
    await expect(page).toHaveURL(/[?&]lnb=history/, { timeout: 15_000 })
    const children = n.locator('.detail-fullpage-modal__lnb-children-wrap--open .detail-fullpage-modal__lnb-child')
    const childCount = await children.count()
    if (childCount < 2) return noteDataAbsent(`'김개인' 역할의 참여 이력 하위 메뉴 ${childCount}개(<2) — 역할 데이터상 하위 메뉴 push 불가`)
    await expect(activeChild(n)).toHaveCount(1)
    const child0 = param(page, 'programsChild')
    const active0 = (await activeChild(n).innerText()).trim()
    const baseIdx = await historyIdx(page)
    const target = n.locator('.detail-fullpage-modal__lnb-children-wrap--open .detail-fullpage-modal__lnb-child:not(.detail-fullpage-modal__lnb-child--active)').first()
    const targetLabel = (await target.innerText()).trim()
    await target.click()
    await expect.poll(() => param(page, 'programsChild')).not.toBe(child0)
    await expectIdx(page, baseIdx + 1)
    await expect(activeChild(n)).toHaveText(targetLabel)
    const len = await historyLength(page)
    await activeChild(n).click()
    await expectIdx(page, baseIdx + 1)
    expect(await historyLength(page)).toBe(len)
    await page.goBack()
    await expect.poll(() => param(page, 'programsChild')).toBe(child0)
    await expectIdx(page, baseIdx)
    await expect(activeChild(n)).toHaveText(active0)
  })

  // goto 2회: (1) LIST 에서 id 수집 후 X, (2) 딥링크
  test('딥링크 상세 X — replace(idx·length 불변), goBack 해도 상세 재등장 없음', async ({ page, context }) => {
    test.setTimeout(150_000)
    const discovery = await context.newPage()
    let id: string | null = null
    try {
      const seedIdx = await openList(discovery)
      if (seedIdx == null) return noteDataAbsent('회원 목록 행 없음(빈 상태 확인)')
      await openRow(discovery, seedIdx)
      id = param(discovery, 'id')
    } finally { await discovery.close() }
    expect(id).toBeTruthy()
    await page.goto(`${LIST}&id=${encodeURIComponent(id!)}`)
    await expect(page).toHaveURL(/[?&]id=/)
    await expect(lnb(page)).toBeVisible({ timeout: 30_000 })
    const deepIdx = await historyIdx(page)
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]id=/, { timeout: 15_000 })
    await expectIdx(page, deepIdx)
    expect(await historyLength(page)).toBe(len)
    await page.goBack()
    await expectSearchParams(page, { id: null })
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  // goto 1회
  test('같은 틱 X 두 번(이벤트 2회 확인) — idx가 목록보다 작아지지 않음', async ({ page }) => {
    test.setTimeout(120_000)
    const listIdx = await openList(page)
    if (listIdx == null) return noteDataAbsent('회원 목록 행 없음(빈 상태 확인)')
    await openRow(page, listIdx)
    expect(await doubleClickSameTick(closeButton(page))).toBe(2)
    await expect(page).not.toHaveURL(/[?&]id=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
  })

  // goto 1회: /users/list?kind=institutions (학교는 kind=all 미포함 — 위 주석)
  test('학교 상세(detail-info) → 소속 교사 행 → id 교사로 push → X는 학교 id·당시 LNB 로 뒤로 → 다시 X는 목록', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openList(page, '/users/list?kind=institutions')
    if (listIdx == null) return noteDataAbsent('학교 목록 행 없음(빈 상태 확인)')
    await openRow(page, listIdx)
    await expect(lnb(page)).toHaveAttribute('aria-label', '학교 상세 메뉴')
    const schoolId = param(page, 'id')
    const schoolLnb = param(page, 'lnb')
    const schoolActive = (await activeTop(lnb(page)).innerText()).trim()
    const section = dialog(page).locator('.school-affiliated-teachers-section')
    await expect(section.getByRole('heading', { name: '소속 교사 목록' })).toBeVisible({ timeout: 30_000 })
    const linkedRow = section.locator(`${DATA_ROW}[style*="cursor: pointer"]`).first()
    if (!(await hasDataRow(section)) || (await linkedRow.count()) === 0)
      return noteDataAbsent('첫 학교에 CMS 회원 연결(linkedUserId) 소속 교사 없음')
    const schoolIdx = await historyIdx(page)
    await linkedRow.click()
    await expect.poll(() => param(page, 'id')).not.toBe(schoolId)
    await expectIdx(page, schoolIdx + 1)
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect.poll(() => param(page, 'id')).toBe(schoolId)
    await expectIdx(page, schoolIdx)
    await expectSearchParams(page, { lnb: schoolLnb })
    await expect(lnb(page)).toHaveAttribute('aria-label', '학교 상세 메뉴')
    await expect(activeTop(lnb(page))).toHaveText(schoolActive)
    expect(await historyLength(page)).toBe(len)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]id=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
  })
})
