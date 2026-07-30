import { test, expect } from '../../../../fixtures/test'
import { GeminiPerformancePage } from '../../../../pages/gemini-performance.page'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 6 — Gemini 실적 관리 목록 셸
 *
 * 시드/API 없어도 필터·등록 버튼·테이블/empty 통과.
 */
test.describe('Gemini 실적 관리 목록 셸', () => {
  test.describe.configure({ mode: 'serial' })

  test('6.1) 목록 셸 · 전체 프로그램', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()
    await expect(page).toHaveURL(/\/programs\/gemini\/performance/)
    await expect(page.getByText(/실적/).first()).toBeVisible()
  })

  test('6.2) 필터 필드 노출', async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()
    await perf.expectFilterFieldsVisible()
  })

  test('6.3) 연수 보고서 등록 · file input', async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()
    await perf.expectRegisterControls()
  })
})
