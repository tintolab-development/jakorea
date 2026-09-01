import { test, expect } from '../../../../fixtures/test'
import { GeminiPerformancePage } from '../../../../pages/gemini-performance.page'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 6 — Gemini 실적 ↔ 찾아가는 연수 격리
 *
 * 실적 URL에는 모집/승인 탭·recruitmentId 상세가 없어야 함.
 */
test.describe('Gemini 실적 관리 격리', () => {
  test('6.6) 찾아가는 연수 탭 부재 · 실적 전용 셸', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()
    await perf.expectVisitingTrainingTabsAbsent()

    await expect(page).not.toHaveURL(/visiting-training/)
    await expect(page).not.toHaveURL(/recruitmentId=/)
    await expect(page.getByRole('button', { name: '모집 공고 추가' })).toHaveCount(0)
  })
})
