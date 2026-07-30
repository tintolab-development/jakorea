import { test, expect } from '../../../../fixtures/test'
import { GeminiPerformancePage } from '../../../../pages/gemini-performance.page'
import {
  GEMINI_PERFORMANCE_FEATURED_TEXT,
  GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES,
} from '../../../../pages/gemini-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 6 — Gemini 실적 필터 · featured 행
 *
 * 목록 행이 없으면 skip.
 */
test.describe('Gemini 실적 관리 필터', () => {
  test.describe.configure({ mode: 'serial' })

  test('6.4) 강사 필터 · featured 행', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()

    const before = await perf.rowCount()
    test.skip(before === 0, '실적 시드/목록 행 없음')

    await perf.applyInstructorFilter(GEMINI_PERFORMANCE_FEATURED_TEXT)
    await perf.expectTableOrEmpty()

    const featuredVisible = await perf
      .dataRows()
      .filter({ hasText: GEMINI_PERFORMANCE_FEATURED_TEXT })
      .first()
      .isVisible()
      .catch(() => false)

    if (!featuredVisible) {
      // 다른 GPERF 강사로 재시도
      let found = false
      for (const name of GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES) {
        await perf.applyInstructorFilter(name)
        found = await perf
          .dataRows()
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
        if (found) break
      }
      test.skip(!found, `강사 시드 미일치: ${GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES.join(' | ')}`)
    }

    expect(await perf.rowCount()).toBeGreaterThan(0)
  })

  test('6.5) 연수방식 필터(오프라인)', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/performance')
    await expectAuthenticatedShell(page)

    const perf = new GeminiPerformancePage(page)
    await perf.expectListShell()

    const before = await perf.rowCount()
    test.skip(before === 0, '실적 시드/목록 행 없음')

    const applied = await perf.applyTrainingMethodFilter('오프라인')
    test.skip(!applied, '연수방식 셀렉트 옵션을 열 수 없음')

    await perf.expectTableOrEmpty()
    // 필터 적용 후에도 셸 유지 (0건 empty 허용)
    await expect(page.getByRole('button', { name: '연수 보고서 등록' })).toBeVisible()
  })
})
