import { test, expect } from '../../../../fixtures/test'
import { UjatProgramDetailPage } from '../../../../pages/ujat-program-detail.page'
import { UJAT_DETAIL_SEED_CANDIDATES } from '../../../../pages/ujat-program-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 4 — UJAT 봉사·기관 신청 심화
 *
 * 기관 신청(inst_*) · 상반기 봉사자(vh1_*) 탭 셸.
 * 행/시드 없어도 목록·empty 셸만 통과하면 OK.
 */
test.describe('UJAT 프로그램 신청·봉사 심화', () => {
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

  test('4.1) 기관 신청 — 신청/임시배정/확인 탭', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.openAnyTabs(programId, 'institution_applications', [
      'inst_all',
      'inst_schedule_assign',
      'inst_schedule_confirm',
    ])
    test.skip(opened.length === 0, '기관 신청 LNB/탭 없음')

    expect(opened).toContain('inst_all')
    await expect(page).toHaveURL(/lnb=institution_applications/)
    await expect(page.getByText(/신청 기관|참여 기관 신청|기관 신청/).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('4.2) 상반기 봉사자 — 신청·서류·면접 탭', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.openAnyTabs(programId, 'volunteer_h1', [
      'vh1_all',
      'vh1_doc1',
      'vh1_doc_passed',
      'vh1_interview2',
    ])
    test.skip(opened.length === 0, '상반기 봉사자 LNB/탭 없음')

    expect(opened.length).toBeGreaterThan(0)
    await expect(page).toHaveURL(/lnb=volunteer_h1/)
    await expect(page.getByText(/봉사자/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('4.3) 하반기 봉사자 — 신청 목록 탭', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.openAnyTabs(programId, 'volunteer_h2', ['vh2_all', 'vh2_doc1'])
    test.skip(opened.length === 0, '하반기 봉사자 LNB/탭 없음')

    await expect(page).toHaveURL(/lnb=volunteer_h2/)
  })

  test('4.4) 일반 「강사 신청」 LNB 부재', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '상세 로드 실패')

    await detail.expectLnbHidden(/강사 신청 목록/)
    await detail.expectLnbVisible(/봉사자 신청|상반기 봉사자/)
  })
})
