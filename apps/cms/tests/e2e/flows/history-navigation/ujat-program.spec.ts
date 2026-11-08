import { findSponsoredProgram } from '../../helpers/program-history-readonly'
import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { historyIdx, historyLength, expectSearchParams, type ClickTargetElement, expectDeepLinkReplaced } from '../../helpers/history-stack'
import { UjatProgramDetailPage } from '../../pages/ujat-program-detail.page'
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
function activeChild(nav: ReturnType<Page['locator']>) {
  return nav.locator('.detail-fullpage-modal__lnb-child--active')
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
 * UJAT 프로그램 상세 history 정합성 — `/programs/ujat`
 * 실코드 확인:
 * - programId / lnb / tab — ujat-program-detail-fullpage-modal.tsx (LNB_PARAM, TAB_PARAM)
 * - 봉사자 심사 신청자 상세: applicantId (UJAT_APPLICANT_ID_PARAM, lib/ujat-program-detail-url.ts)
 * - 봉사자 LNB: '상반기 봉사자 신청 목록'(volunteer_h1) / '하반기 봉사자 신청 목록'(volunteer_h2); 면접 사용 시 하위
 *   `${prefix}_doc1|_doc_passed|_interview2`. 기타 중첩 키 instAppId/eduInstId/eduVolId 는 본 초안 미검증
 * - LNB DOM: `.detail-fullpage-modal__lnb-item(--active)`, `.detail-fullpage-modal__lnb-child(--active)`,
 *   child label `[data-text]` (features/program/ujat/ui/detail-modal/ujat-program-detail-sidebar.tsx)
 * - breadcrumb: nav[aria-label="풀페이지 상세 경로"] `.detail-fullpage-breadcrumb__button` (첫=목록, 둘째=프로그램명)
 * - 후원사: 조회 모드 `button.program-detail-sponsor-link` → `/sponsor?sponsorId=…&returnTo=…` 로 navigate(push).
 *   program 경로 위 `sponsorId` 오버레이를 여는 호출부(appendSponsorDetailQueryStack)는 현재 코드에 없음 → 라우트 push 로 검증.
 * 허용 goto: test별 주석. 공통 스택 도중 추가 goto 없음.
 */
const LIST_PATH = '/programs/ujat'
const NAV_NAME = 'UJAT 프로그램 상세 메뉴'
const NESTED_KEYS = ['applicantId', 'instAppId', 'eduInstId', 'eduVolId'] as const
const nestedRe = new RegExp(`[?&](${NESTED_KEYS.join('|')})=`)

const nav = (page: Page) => page.getByRole('navigation', { name: NAV_NAME })
const closeButton = (page: Page) => page.getByRole('dialog').getByRole('button', { name: '닫기' }).first()
const crumbButtons = (page: Page) =>
  page.getByRole('navigation', { name: '풀페이지 상세 경로' }).locator('.detail-fullpage-breadcrumb__button')

/** goto 1회 → 목록 데이터 행 확인 → listIdx. 데이터 없음(ant-empty 확인)이면 null */
async function openListOnce(page: Page): Promise<number | null> {
  await page.goto(LIST_PATH)
  await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 30_000 })
  if (!(await hasDataRow(page.locator('body')))) return null
  return historyIdx(page)
}

async function openFirstRow(page: Page, listIdx: number) {
  await page.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(/[?&]programId=/, { timeout: 60_000 })
  await new UjatProgramDetailPage(page).expectDetailShellReady()
  await expectIdx(page, listIdx + 1)
}

type NestedRoute = {
  top: string
  /** 항상 그룹인 상위 메뉴(기관 신청·교육 진행 현황)의 하위 메뉴. 프로그램 구성상 생략될 수 있음 */
  childCandidates?: readonly string[]
  /**
   * 면접 설정이 켜지면 그룹이 되는 봉사자 신청 목록의 목표 하위 메뉴.
   * 앱이 그룹 기본값으로 여는 탭이며, 면접 설정이 꺼졌을 때의 전체 목록(vh1_all)과 같은 DocScreeningSection.
   */
  groupChild?: string
  lnb: string
  tab?: RegExp
  param: string
}

/** 상위 메뉴가 펼치기 전용 그룹인지(화살표 유무) — ujat-program-detail-sidebar.tsx toggleTopBody 버튼 */
function lnbArrow(top: ReturnType<Page['locator']>) {
  return top.locator('.detail-fullpage-modal__lnb-item-arrow')
}
/** 해당 상위 메뉴의 li 안에서만 하위 메뉴를 찾는다(상반기·하반기 같은 라벨 오선택 방지) */
function childWithinGroup(top: ReturnType<Page['locator']>, label: string) {
  return top.locator('xpath=ancestor::li[1]').locator('.detail-fullpage-modal__lnb-child').filter({
    has: top.page().locator(`.detail-fullpage-modal__lnb-child-label[data-text="${label}"]`),
  }).first()
}
/** 그룹을 펼친다. 이미 펼쳐져 있으면 클릭하지 않는다(클릭하면 접힘) */
async function expandGroup(top: ReturnType<Page['locator']>) {
  const arrow = lnbArrow(top)
  if (!/--expanded/.test((await arrow.getAttribute('class')) ?? '')) await top.click()
  await expect(arrow).toHaveClass(/detail-fullpage-modal__lnb-item-arrow--expanded/)
}

/**
 * 중첩 상세 진입 경로: 상위 메뉴(→ 하위 메뉴) 이동 후 첫 행 클릭.
 * - 그룹 상위 메뉴는 클릭해도 이동하지 않고 펼치기만 한다 → 목표 하위 메뉴를 명시적으로 선택.
 * - 하위 메뉴는 프로그램 구성에 따라 생략될 수 있음 → 그 경우만 미실행 기록.
 * 반환: 중첩 진입 직전(목록 엔트리) idx, 또는 미실행 사유 문자열
 */
async function enterNested(
  page: Page,
  route: NestedRoute
): Promise<number | string> {
  const n = nav(page)
  const top = lnbItemByLabel(n, route.top)
  await expect(top).toBeVisible({ timeout: 15_000 })
  const entryIdx = await historyIdx(page)
  const isGroup = (await lnbArrow(top).count()) > 0

  if (route.childCandidates) {
    expect(isGroup, `${route.top}는 그룹 메뉴여야 함`).toBe(true)
    await expandGroup(top)
    await expectIdx(page, entryIdx) // 펼치기는 이동 아님
    let clicked = false
    for (const label of route.childCandidates) {
      const child = childWithinGroup(top, label)
      if ((await child.count()) > 0) {
        await expect(child).toBeVisible({ timeout: 15_000 })
        await child.click()
        await expect(activeChild(n)).toContainText(label)
        clicked = true
        break
      }
    }
    if (!clicked) return `프로그램 구성상 하위 메뉴(${route.childCandidates.join('/')}) 미생성`
  } else if (isGroup) {
    expect(route.groupChild, `${route.top}가 그룹인데 목표 하위 메뉴 미지정`).toBeTruthy()
    await expandGroup(top)
    await expectIdx(page, entryIdx)
    const child = childWithinGroup(top, route.groupChild!)
    await expect(child).toBeVisible({ timeout: 15_000 })
    await child.click()
    await expect(activeChild(n)).toContainText(route.groupChild!)
  } else {
    await top.click()
  }
  await expect(page).toHaveURL(new RegExp(`[?&]lnb=${route.lnb}`), { timeout: 15_000 })
  if (route.tab) await expect.poll(() => new URL(page.url()).searchParams.get('tab') ?? '').toMatch(route.tab)
  await expect(activeTop(n)).toContainText(route.top)
  // 실제 메뉴 이동은 push 1회
  await expectIdx(page, entryIdx + 1)
  const listEntryIdx = await historyIdx(page)
  const dialog = page.getByRole('dialog').first()
  if (!(await hasDataRow(dialog))) return `${route.top} 목록 행 없음(빈 상태 확인)`
  await dialog.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(new RegExp(`[?&]${route.param}=`), { timeout: 30_000 })
  await expectIdx(page, listEntryIdx + 1)
  return listEntryIdx
}

const NESTED_ROUTES: readonly NestedRoute[] = [
  // 면접 설정 꺼짐: 바로 이동(vh1_all) / 켜짐: 그룹 → '1차 서류 심사 대상자'(vh1_doc1)
  { top: '상반기 봉사자 신청 목록', groupChild: '1차 서류 심사 대상자', lnb: 'volunteer_h1', param: 'applicantId' },
  { top: '기관 신청 목록', childCandidates: ['신청 기관'], lnb: 'institution_applications', tab: /^inst_all$/, param: 'instAppId' },
  { top: '상반기 교육 진행 현황', childCandidates: ['참여 기관'], lnb: 'education_progress', tab: /^edu_h1_institutions$/, param: 'eduInstId' },
  { top: '상반기 교육 진행 현황', childCandidates: ['참여 봉사자'], lnb: 'education_progress', tab: /^edu_h1_volunteers$/, param: 'eduVolId' },
]

test.describe('history — UJAT 프로그램 상세', () => {
  // goto 1회: LIST_PATH
  test('목록→상세 push, LNB 변경 push·재클릭 고정, goBack 시 URL·활성 LNB 복원, X는 listIdx(length 불변), forward 시 상세 복원', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openListOnce(page)
    if (listIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
    await openFirstRow(page, listIdx)
    const n = nav(page)
    await expect(activeTop(n)).toHaveCount(1)
    const initialActive = (await activeTop(n).innerText()).trim()
    const initialLnb = new URL(page.url()).searchParams.get('lnb')

    const managers = lnbItemByLabel(n, '담당자 정보')
    await expect(managers).toBeVisible({ timeout: 15_000 })
    await managers.click()
    await expect(page).toHaveURL(/[?&]lnb=managers/, { timeout: 15_000 })
    await expectIdx(page, listIdx + 2)
    await expect(activeTop(n)).toContainText('담당자 정보')
    const lenAfterLnb = await historyLength(page)

    await managers.click() // 이미 선택된 메뉴 재클릭
    await expect(page).toHaveURL(/[?&]lnb=managers/)
    await expectIdx(page, listIdx + 2)
    expect(await historyLength(page)).toBe(lenAfterLnb)

    await page.goBack()
    await expect(page).not.toHaveURL(/[?&]lnb=managers/, { timeout: 15_000 })
    await expectIdx(page, listIdx + 1)
    await expectSearchParams(page, { lnb: initialLnb })
    await expect(activeTop(n)).toHaveText(initialActive)

    const detailUrl = page.url()
    const lengthBefore = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]programId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    await expectSearchParams(page, { programId: null, lnb: null, tab: null })
    await expect(n).toBeHidden({ timeout: 15_000 })
    expect(await historyLength(page)).toBe(lengthBefore)

    await page.goForward()
    await expect(page).toHaveURL(detailUrl, { timeout: 15_000 })
    await expectIdx(page, listIdx + 1)
    await expect(n).toBeVisible({ timeout: 30_000 })
    await expect(activeTop(n)).toHaveText(initialActive)
  })

  // goto 2회: (1) LIST_PATH — programId 수집 후 X 로 목록 복귀, (2) 상세 딥링크(검증 스택 시작)
  test('딥링크 상세 X — 목록으로 replace(idx·length 불변), goBack 해도 상세 재등장 없음', async ({ page, context }) => {
    test.setTimeout(180_000)
    const discovery = await context.newPage()
    let programId: string | null = null
    try {
      const seedIdx = await openListOnce(discovery)
      if (seedIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
      await openFirstRow(discovery, seedIdx)
      programId = new URL(discovery.url()).searchParams.get('programId')
    } finally { await discovery.close() }
    expect(programId).toBeTruthy()
    const priorUrl = page.url() // 새 탭 — 딥링크 직전 엔트리(about:blank). 목록 엔트리 아님
    await page.goto(`${LIST_PATH}?programId=${encodeURIComponent(programId!)}`)
    await expect(page).toHaveURL(/[?&]programId=/, { timeout: 30_000 })
    await new UjatProgramDetailPage(page).expectDetailShellReady()
    const deepIdx = await historyIdx(page)
    const len = await historyLength(page)
    await closeButton(page).click()
    await expect(page).not.toHaveURL(/[?&]programId=/, { timeout: 15_000 })
    await expectIdx(page, deepIdx)
    expect(await historyLength(page)).toBe(len)

    // 뒤로 → 딥링크 직전(about:blank), 앞으로 → replace된 목록(상세 재등장 없음)
    await expectDeepLinkReplaced(page, { priorUrl, detailKeys: ['programId'], replacedIdx: deepIdx })
    await expect(nav(page)).toBeHidden({ timeout: 15_000 })
  })

  // goto 1회
  test('같은 틱 X 두 번(click 이벤트 2회 전달 확인) — idx가 목록보다 작아지지 않음', async ({ page }) => {
    test.setTimeout(120_000)
    const listIdx = await openListOnce(page)
    if (listIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
    await openFirstRow(page, listIdx)
    const btn = closeButton(page)
    await expect(btn).toBeEnabled()
    expect(await doubleClickSameTick(btn)).toBe(2)
    await expect(page).not.toHaveURL(/[?&]programId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    await expect(page).toHaveURL(new RegExp(LIST_PATH.replace(/\//g, '\\/')))
  })

  for (const route of NESTED_ROUTES) {
    // goto 1회
    test(`${route.top}${route.childCandidates ? ` > ${route.childCandidates.join('/')}` : route.groupChild ? ` (그룹이면 > ${route.groupChild})` : ''} 행 → ${route.param} push, 중첩 X는 목록 엔트리로 뒤로(idx-1, length 불변, 모달 유지)`, async ({ page }) => {
      test.setTimeout(180_000)
      const listIdx = await openListOnce(page)
      if (listIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
      await openFirstRow(page, listIdx)
      const entered = await enterNested(page, route)
      if (typeof entered === 'string') return noteDataAbsent(entered)
      const len = await historyLength(page)
      await closeButton(page).click()
      await expect(page).not.toHaveURL(new RegExp(`[?&]${route.param}=`), { timeout: 15_000 })
      await expectIdx(page, entered)
      await expectSearchParams(page, { [route.param]: null })
      await expect(page).toHaveURL(/[?&]programId=/)
      await expect(nav(page)).toBeVisible()
      await expect(activeTop(nav(page))).toContainText(route.top)
      expect(await historyLength(page)).toBe(len)
    })
  }

  // goto 1회
  test('중첩 상태 breadcrumb 프로그램명 클릭 — 첫 상세 엔트리까지 multi-back(length 불변), 목록 breadcrumb는 listIdx', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openListOnce(page)
    if (listIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
    await openFirstRow(page, listIdx)
    // 프로그램명 crumb 목표 URL(lnb=info&tab=info)이 첫 상세 엔트리와 같아야 multi-back 대상이 됨 — 전제 단언
    await expectSearchParams(page, { lnb: 'info', tab: 'info' })
    const detailIdx = listIdx + 1
    const entered = await enterNested(page, NESTED_ROUTES[0])
    if (typeof entered === 'string') return noteDataAbsent(entered)
    expect(await historyIdx(page)).toBeGreaterThanOrEqual(detailIdx + 2)
    const len = await historyLength(page)

    const crumbs = crumbButtons(page)
    await expect(crumbs.nth(1)).toBeVisible()
    await expect(crumbs.nth(1)).not.toHaveText(/^\s*$/)
    await crumbs.nth(1).click()
    await expect(page).not.toHaveURL(nestedRe, { timeout: 15_000 })
    await expectIdx(page, detailIdx)
    await expectSearchParams(page, { lnb: 'info', tab: 'info' })
    expect(await historyLength(page)).toBe(len)

    await crumbs.first().click()
    await expect(page).not.toHaveURL(/[?&]programId=/, { timeout: 15_000 })
    await expectIdx(page, listIdx)
    expect(await historyLength(page)).toBe(len)
  })

  // goto 1회. 시드: 목록 현재 페이지에서 후원사가 지정된 첫 프로그램(findSponsoredProgram).
  // 없으면 helper가 'NOT EXECUTED — 다른 페이지 시드는 미탐색' note 후 종료(FAIL 아님).
  // ⚠ 실제 링크는 /sponsor 별도 페이지로 이동한다. 프로그램 위 sponsorId 오버레이 push/back 요구의 PASS가 아니다(계약 차이).
  test('후원사 링크 → /sponsor 상세 push(sponsorId·returnTo), X는 프로그램 상세 엔트리로 뒤로(sponsorId 없음)', async ({ page }) => {
    test.setTimeout(180_000)
    const listIdx = await openListOnce(page)
    if (listIdx == null) return noteDataAbsent('목록 데이터 행 없음(빈 상태 확인)')
    const link = await findSponsoredProgram(page, listIdx)
    if (!link) return
    const programUrl = page.url()
    const before = await historyIdx(page)
    const len = await historyLength(page)
    await link.click()
    await expect(page).toHaveURL(/\/sponsor\?.*sponsorId=/, { timeout: 30_000 })
    await expectSearchParams(page, { returnTo: new URL(programUrl).pathname + new URL(programUrl).search })
    await expectIdx(page, before + 1)
    // 후원사 페이지는 지연 로딩 — 그동안 이전 화면(프로그램 상세)이 남아 있다.
    // 프로그램 상세 메뉴가 사라지고 후원사 상세 하나만 뜬 뒤 X를 누른다.
    await expect(nav(page)).toHaveCount(0, { timeout: 30_000 })
    await expect(page.getByRole('dialog')).toHaveCount(1, { timeout: 30_000 })
    await page.getByRole('dialog').getByRole('button', { name: '닫기' }).first().click()
    await expect(page).toHaveURL(programUrl, { timeout: 15_000 })
    await expectIdx(page, before)
    await expectSearchParams(page, { sponsorId: null })
    expect(await historyLength(page)).toBe(len + 1)
  })
})

// UI overlay-open trigger is absent; this tests only the reachable deep-link fallback, NOT overlay push.
test('후원사 오버레이 딥링크 X — 조상 없는 새 탭에서 프로그램 상세 replace(push 검증 아님)', async ({ page, context }) => {
  test.setTimeout(180_000)
  const discovery = await context.newPage()
  let overlay: URL | undefined
  try {
    const idx = await openListOnce(discovery)
    if (idx == null) return noteDataAbsent('목록 행 없음 — 오버레이 딥링크 시드 미확보')
    const link = await findSponsoredProgram(discovery, idx)
    if (!link) return
    const program = new URL(discovery.url())
    await link.click()
    await expect(discovery).toHaveURL(url => url.pathname === '/sponsor' && url.searchParams.has('sponsorId'))
    const sponsor = new URL(discovery.url())
    program.searchParams.set('sponsorId', sponsor.searchParams.get('sponsorId')!)
    const sponsorLnb = sponsor.searchParams.get('sponsorLnb')
    if (sponsorLnb) program.searchParams.set('sponsorLnb', sponsorLnb)
    overlay = program
  } finally { await discovery.close() }
  await page.goto(overlay!.href)
  await expect(page.getByRole('dialog').last()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('dialog')).toHaveCount(2)
  const idx = await historyIdx(page)
  const length = await historyLength(page)
  await page.getByRole('dialog').last().locator('.detail-fullpage-modal__close').click()
  await expectSearchParams(page, { programId: overlay!.searchParams.get('programId'), sponsorId: null, sponsorLnb: null })
  await expectIdx(page, idx)
  expect(await historyLength(page)).toBe(length)
  await expect(nav(page)).toBeVisible()
})
