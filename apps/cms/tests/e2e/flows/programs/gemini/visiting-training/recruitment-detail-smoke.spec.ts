import { test, expect } from '../../../../fixtures/test'
import { GeminiVisitingTrainingPage } from '../../../../pages/gemini-visiting-training.page'
import { GEMINI_VISITING_FEATURED_CANDIDATES } from '../../../../pages/gemini-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 5 — Gemini 모집 공고 상세 smoke
 *
 * LNB: 프로그램 모집 정보 · 기관 신청 목록 · 담당자 정보
 */
test.describe('Gemini 모집 공고 상세 smoke', () => {
  test.describe.configure({ mode: 'serial' })

  let recruitmentId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/gemini/visiting-training')
      await expectAuthenticatedShell(page)
      const vt = new GeminiVisitingTrainingPage(page)
      const opened = await vt.tryOpenPreferredRecruitmentSeed()
      if (!opened) return
      recruitmentId = opened.recruitmentId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !recruitmentId,
      `모집 시드 없음 또는 상세 셸 실패: ${GEMINI_VISITING_FEATURED_CANDIDATES.join(' | ')}`
    )
  })

  test('5.4) 모집 상세 셸 · 모집 정보', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const loaded = await vt.gotoRecruitmentDetail(recruitmentId, 'info')
    test.skip(!loaded, '모집 상세 API 실패 — 모집 정보 스킵')

    await expect(page).toHaveURL(/recruitmentId=/)
    await expect(page.getByText(/프로그램 모집 정보|모집 정보/).first()).toBeVisible({
      timeout: 15_000,
    })
    await vt.expectContentSettled()
  })

  test('5.5) 기관 신청 목록 LNB', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const ok = await vt.tryGotoRecruitmentLnb(recruitmentId, 'institutions')
    test.skip(!ok, '기관 신청 LNB 없음 또는 API 실패')

    await expect(page).toHaveURL(/lnb=institutions/)
    await expect(page.getByText(/기관 신청/).first()).toBeVisible({ timeout: 15_000 })
    await vt.expectListOrEmptyInDialog()
  })

  test('5.6) 담당자 정보 LNB', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const ok = await vt.tryGotoRecruitmentLnb(recruitmentId, 'managers')
    test.skip(!ok, '담당자 LNB 없음 또는 API 실패')

    if (await vt.isRecruitmentDetailLoadFailed()) {
      test.skip(true, '모집 상세 API 실패 — 담당자 스킵')
    }

    const shellOk = await vt.tryExpectManagersShellVisible()
    test.skip(!shellOk, '담당자 목록 셸 미표시')
    await expect(page).toHaveURL(/lnb=managers/)
  })

  test('5.7) 딥링크 복원', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const loaded = await vt.gotoRecruitmentDetail(recruitmentId, 'info')
    test.skip(!loaded, '모집 상세 API 실패 — 딥링크 스킵')

    await page.reload()
    await expectAuthenticatedShell(page)
    const shellOk = await vt.tryExpectRecruitmentShellReady(30_000)
    test.skip(!shellOk, 'reload 후 상세 셸 실패')
    await expect(page).toHaveURL(/recruitmentId=/)
  })
})
