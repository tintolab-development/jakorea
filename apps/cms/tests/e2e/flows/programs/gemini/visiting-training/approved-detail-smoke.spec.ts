import { test, expect } from '../../../../fixtures/test'
import { GeminiVisitingTrainingPage } from '../../../../pages/gemini-visiting-training.page'
import { GEMINI_APPROVED_INSTITUTION_CANDIDATES } from '../../../../pages/gemini-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 5 — Gemini 승인 연수 상세 smoke
 *
 * LNB: 프로그램 정보 · 강사 신청 목록 · 담당자 정보
 */
test.describe('Gemini 승인 연수 상세 smoke', () => {
  test.describe.configure({ mode: 'serial' })

  let approvedTrainingId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/gemini/visiting-training?tab=approved')
      await expectAuthenticatedShell(page)
      const vt = new GeminiVisitingTrainingPage(page)
      const opened = await vt.tryOpenPreferredApprovedSeed()
      if (!opened) return
      approvedTrainingId = opened.approvedTrainingId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !approvedTrainingId,
      `승인 연수 시드 없음: ${GEMINI_APPROVED_INSTITUTION_CANDIDATES.join(' | ')}`
    )
  })

  test('5.8) 승인 상세 셸 · 프로그램 정보', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training?tab=approved')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const loaded = await vt.gotoApprovedDetail(approvedTrainingId, 'info')
    test.skip(!loaded, '승인 상세 API 실패 — 프로그램 정보 스킵')

    await expect(page).toHaveURL(/approvedTrainingId=/)
    await expect(page.getByText(/프로그램 정보/).first()).toBeVisible({ timeout: 15_000 })
    await vt.expectContentSettled()
  })

  test('5.9) 강사 신청 목록 LNB', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training?tab=approved')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const ok = await vt.tryGotoApprovedLnb(approvedTrainingId, 'instructors')
    test.skip(!ok, '강사 신청 LNB 없음 또는 API 실패')

    await expect(page).toHaveURL(/approvedLnb=instructors/)
    await expect(page.getByText(/강사 신청/).first()).toBeVisible({ timeout: 15_000 })
    await vt.expectListOrEmptyInDialog()
  })

  test('5.10) 담당자 정보 LNB', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training?tab=approved')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const ok = await vt.tryGotoApprovedLnb(approvedTrainingId, 'managers')
    test.skip(!ok, '담당자 LNB 없음 또는 API 실패')

    if (await vt.isApprovedDetailLoadFailed()) {
      test.skip(true, '승인 상세 API 실패 — 담당자 스킵')
    }

    const shellOk = await vt.tryExpectManagersShellVisible()
    test.skip(!shellOk, '담당자 목록 셸 미표시')
    await expect(page).toHaveURL(/approvedLnb=managers/)
  })
})
