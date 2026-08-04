import { test, expect } from '../../../../fixtures/test'
import { GeminiVisitingTrainingPage } from '../../../../pages/gemini-visiting-training.page'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 5 — Gemini 찾아가는 연수 목록 탭 smoke
 *
 * 모집 공고 ↔ 승인 연수 탭 전환 · 셸. 시드 없어도 목록/empty 통과.
 */
test.describe('Gemini 찾아가는 연수 목록 탭', () => {
  test.describe.configure({ mode: 'serial' })

  test('5.1) 모집 공고 탭 셸', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    await vt.expectListShell('recruitment')
    await expect(page.getByText('모집 공고').first()).toBeVisible()
    await expect(page).not.toHaveURL(/tab=approved/)
  })

  test('5.2) 승인 연수 탭 전환', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    await vt.selectListTab('approved')
    await expect(page.getByText(/승인 연수/).first()).toBeVisible()
  })

  test('5.3) 모집 공고 탭 복귀', async ({ page }) => {
    test.setTimeout(120_000)

    const vt = new GeminiVisitingTrainingPage(page)
    await vt.gotoList('approved')
    await expectAuthenticatedShell(page)
    await vt.expectListShell('approved')

    await vt.selectListTab('recruitment')
    await expect(page.getByRole('button', { name: '모집 공고 추가' })).toBeVisible()
  })
})
