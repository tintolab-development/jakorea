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



test.use({ trace: 'off', video: 'off', screenshot: 'off' })

/**
 * 회원 상세 → 프로그램 상세 → 복귀 — features/user/detail/lib/member-detail-program-navigation-return.ts
 * STORAGE_KEY 'cms:member-detail-return-after-program': stash 시 `/users/list`+id URL 저장,
 * tryNavigateMemberDetailReturn 이 소비(remove) 후 navigateToAncestorOrReplace,
 * discardMemberDetailReturnOutsidePrograms 가 /programs 밖 진입 시 삭제.
 * 시드 전제: member-detail-single-click-open.spec.ts 와 동일 '김개인'(참여이력 5건).
 * 사이드 메뉴: widgets/layout/sidebar.tsx antd Menu(inline) — '프로그램 관리' > '일반 프로그램'(/programs/general).
 */
const STORAGE_KEY = 'cms:member-detail-return-after-program'
const SEED_MEMBER = '김개인'
const stored = (page: Page) => page.evaluate(k => sessionStorage.getItem(k), STORAGE_KEY)
const memberDialog = (page: Page) => page.getByRole('dialog').first()

/** goto 1회 → 김개인 상세 → 참여 이력 LNB. 시드 부재(빈 상태 확인) 시 문자열 사유 */
async function openMemberHistory(page: Page) {
  await page.goto('/users/list?kind=all')
  await expect(page.getByPlaceholder('회원명을 입력해 주세요')).toBeVisible({ timeout: 60_000 })
  await page.getByPlaceholder('회원명을 입력해 주세요').fill(SEED_MEMBER)
  await page.getByRole('button', { name: '조회' }).click()
  if (!(await hasDataRow(page.locator('body')))) return `회원 '${SEED_MEMBER}' 시드 없음(빈 상태 확인)`
  await page.locator(DATA_ROW).first().click()
  await expect(page).toHaveURL(/[?&]id=/, { timeout: 15_000 })
  await expect(memberDialog(page)).toBeVisible({ timeout: 30_000 })
  await page.getByText(/^(프로젝트|프로그램) 참여 이력$/).first().click()
  await expect(page).toHaveURL(/[?&]lnb=history/, { timeout: 15_000 })
  if (!(await hasDataRow(memberDialog(page)))) return `'${SEED_MEMBER}' 참여 이력 행 없음(빈 상태 확인)`
  return { idx: await historyIdx(page), url: page.url() }
}

async function gotoGeneralViaSidebar(page: Page) {
  const item = page.getByRole('menuitem', { name: '일반 프로그램' })
  if (!(await item.isVisible())) await page.getByRole('menuitem', { name: '프로그램 관리' }).click()
  await expect(item).toBeVisible({ timeout: 15_000 })
  await item.click()
  await expect(page).toHaveURL(/\/programs\/general(\?|$)/, { timeout: 15_000 })
}

test.describe('history — 회원 상세 → 프로그램 상세 복귀', () => {
  // goto 1회: /users/list?kind=all
  test('프로그램 X — 저장된 회원 상세 엔트리로 뒤로(idx 동일·length 불변), 복귀 키 소비', async ({ page }) => {
    test.setTimeout(180_000)
    const m = await openMemberHistory(page)
    if (typeof m === 'string') return noteDataAbsent(m)
    await memberDialog(page).locator(DATA_ROW).first().click()
    await expect(page).toHaveURL(/\/programs\/[^?]+\?.*programId=/, { timeout: 30_000 })
    await expectIdx(page, m.idx + 1)
    const saved = await stored(page)
    expect(saved).not.toBeNull()
    const savedUrl = new URL(saved!, 'http://local')
    expect(savedUrl.pathname).toBe(new URL(m.url).pathname)
    expect(savedUrl.searchParams.get('id')).toBe(new URL(m.url).searchParams.get('id'))
    const len = await historyLength(page)
    await page.getByRole('dialog').getByRole('button', { name: '닫기' }).first().click()
    await expect(page).toHaveURL(/\/users\/list\?.*\bid=/, { timeout: 15_000 })
    await expectIdx(page, m.idx)
    await expectSearchParams(page, { id: new URL(m.url).searchParams.get('id'), lnb: 'history' })
    expect(await historyLength(page)).toBe(len)
    await expect.poll(() => stored(page)).toBeNull()
  })

  // goto 1회: /users/list?kind=all. 이후 무관 프로그램은 사이드 메뉴 클릭으로만 이동
  test('브라우저 back 으로 회원 복귀 시 키 삭제 → 무관 프로그램 open/close 는 프로그램 목록에 머묾(stale 회원 복귀 없음)', async ({ page }) => {
    test.setTimeout(180_000)
    const m = await openMemberHistory(page)
    if (typeof m === 'string') return noteDataAbsent(m)
    await memberDialog(page).locator(DATA_ROW).first().click()
    await expect(page).toHaveURL(/\/programs\/.*programId=/, { timeout: 30_000 })
    expect(await stored(page)).not.toBeNull()
    await page.goBack()
    await expect(page).toHaveURL(/\/users\/list/, { timeout: 15_000 })
    await expectIdx(page, m.idx)
    await expect.poll(() => stored(page)).toBeNull()

    await gotoGeneralViaSidebar(page)
    if (!(await hasDataRow(page.locator('body')))) return noteDataAbsent('일반 프로그램 목록 행 없음(빈 상태 확인)')
    const listIdx = await historyIdx(page)
    await page.locator(DATA_ROW).first().click()
    await expect(page).toHaveURL(/[?&]programId=/, { timeout: 30_000 })
    await expectIdx(page, listIdx + 1)
    expect(await stored(page)).toBeNull()
    await page.getByRole('dialog').getByRole('button', { name: '닫기' }).first().click()
    await expect(page).not.toHaveURL(/[?&]programId=/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/programs\/general/)
    await expectIdx(page, listIdx)
    await expectSearchParams(page, { id: null })
  })
})
