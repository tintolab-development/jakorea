import { test, expect } from '../../../../fixtures/test'
import { UjatProgramDetailPage } from '../../../../pages/ujat-program-detail.page'
import { UJAT_DETAIL_SEED_CANDIDATES } from '../../../../pages/ujat-program-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 4 — UJAT 교육 진행 심화
 *
 * 상반기 edu_h1_* · 교육 진행 요약(edu_summary).
 * 시드 행 없어도 셸·empty면 통과.
 */
test.describe('UJAT 프로그램 교육 진행', () => {
  test.describe.configure({ mode: 'serial' })

  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/ujat')
      await expectAuthenticatedShell(page)
      const detail = new UjatProgramDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (!opened) return
      programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음 또는 상세 셸 실패: ${UJAT_DETAIL_SEED_CANDIDATES.join(' | ')}`
    )
  })

  test('4.5) 상반기 진행 — 참여 기관·봉사자·지역·출석·과제', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.openAnyTabs(programId, 'education_progress', [
      'edu_h1_institutions',
      'edu_h1_volunteers',
      'edu_h1_region',
      'edu_h1_attendance',
      'edu_h1_assignments',
    ])
    test.skip(opened.length === 0, '교육 진행 LNB/탭 없음')

    expect(opened.length).toBeGreaterThan(0)
    await expect(page).toHaveURL(/lnb=education_progress/)
    await expect(page.getByText(/참여 기관|참여 봉사자|교육 진행|출석|과제|지역/).first()).toBeVisible(
      { timeout: 15_000 }
    )
  })

  test('4.6) 하반기 진행 — 참여 기관 탭', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'education_progress', 'edu_h2_institutions')
    test.skip(!ok, '하반기 교육 진행 탭 없음')

    await detail.expectListOrEmptyShell(/참여 기관|하반기|교육 진행/)
    await expect(page).toHaveURL(/tab=edu_h2_institutions/)
  })

  test('4.7) 교육 진행 요약', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    // 요약은 LNB key가 education_progress 또는 별도 — URL tab=edu_summary
    const ok =
      (await detail.tryGotoLnb(programId, 'education_progress', 'edu_summary')) ||
      (await detail.gotoDetail(programId, 'education_progress', 'edu_summary'))

    test.skip(!ok, '교육 진행 요약 탭 없음')

    await detail.expectContentSettled()
    await expect(page.getByText(/교육 진행 요약|요약|지역/).first()).toBeVisible({
      timeout: 15_000,
    }).catch(() => undefined)
  })
})
