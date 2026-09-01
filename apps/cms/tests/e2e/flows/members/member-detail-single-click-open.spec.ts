import { test, expect } from '@playwright/test'

/**
 * 회귀 방지: 목록/이력 행을 **한 번** 클릭하면 풀페이지 상세가 열려야 한다.
 *
 * 과거 증상 — react-router가 `setSearchParams`를 transition으로 커밋해 `params.id`
 * 반영이 한 커밋 늦는 사이, "URL에 id가 없으면 닫기" effect가 방금 연 상세를 닫아
 * URL만 바뀌고 화면은 목록에 머물렀다(두 번 클릭해야 열림).
 *
 * 전제: `김개인`(member-detail-history seed) 참여이력 5건.
 */
test.describe('회원 상세 1클릭 오픈', () => {
  test('목록 행 1클릭 → 회원 상세, 참여이력 행 1클릭 → 프로그램 상세', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/users/list?kind=all')
    await page.waitForSelector('tr.ant-table-row', { timeout: 60_000 })

    await page.getByPlaceholder('회원명을 입력하세요').fill('김개인')
    await page.getByRole('button', { name: '조회' }).click()
    await expect(page.locator('tr.ant-table-row').first()).toBeVisible({ timeout: 30_000 })

    // 목록 행 1클릭 → 회원 상세 풀페이지
    await page.locator('tr.ant-table-row').first().click()
    const memberDetail = page.getByRole('dialog').first()
    await expect(memberDetail).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /회원 상세 \(김개인\)/ })).toBeVisible()
    await expect(page).toHaveURL(/[?&]id=/)

    // 프로젝트(프로그램) 참여 이력 → 수강 이력
    await page.getByText(/^(프로젝트|프로그램) 참여 이력$/).first().click()
    await expect(page).toHaveURL(/lnb=history/, { timeout: 15_000 })

    const historyRows = page.getByRole('dialog').locator('tr.ant-table-row')
    await expect(historyRows.first()).toBeVisible({ timeout: 30_000 })

    // 이력 행 1클릭 → 프로그램 상세 풀페이지 (목록 화면으로 튕기지 않음)
    await historyRows.first().click()
    await expect(page).toHaveURL(/\/programs\/[^?]+\?.*programId=/, { timeout: 30_000 })
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: '닫기' }).first()).toBeVisible()
  })

  test('뒤로가기로 URL id가 사라지면 회원 상세가 닫힌다', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/users/list?kind=all')
    await page.waitForSelector('tr.ant-table-row', { timeout: 60_000 })

    await page.locator('tr.ant-table-row').first().click()
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 30_000 })
    // 상세 오픈(GET → URL 반영)이 끝난 뒤 뒤로가기 — 오픈 진행 중 뒤로가기는 대상 아님
    await expect(page).toHaveURL(/[?&]id=/, { timeout: 15_000 })

    await page.goBack()
    await expect(page).not.toHaveURL(/[?&]id=/, { timeout: 15_000 })
    await expect(page.getByRole('dialog').first()).toBeHidden({ timeout: 15_000 })
  })
})
