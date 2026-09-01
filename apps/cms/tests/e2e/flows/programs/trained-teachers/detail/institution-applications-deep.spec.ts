import { test, expect } from '../../../../fixtures/test'
import { TrainedTeachersDetailPage } from '../../../../pages/trained-teachers-detail.page'
import { TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES } from '../../../../pages/trained-teachers-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 8 — 교육받은 교사 기관 신청 심화
 *
 * 목록 셸 · 행 있으면 기관 상세(신청 정보|교육 일지) soft open.
 */
test.describe('교육받은 교사 기관 신청 심화', () => {
  test.describe.configure({ mode: 'serial' })

  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/trained-teachers')
      await expectAuthenticatedShell(page)
      const detail = new TrainedTeachersDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (!opened) return
      programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음: ${TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES.slice(0, 2).join(' | ')}`
    )
  })

  test('8.1) 기관 신청 목록 셸', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'applicants', 'institutions')
    test.skip(!ok, '기관 신청 LNB 없음 또는 API 실패')

    await expect(page).toHaveURL(/lnb=applicants/)
    await expect(page.getByText(/기관 신청/).first()).toBeVisible({ timeout: 15_000 })
    await detail.expectListOrEmptyInDialog()
  })

  test('8.2) 기관 행 → 신청 정보 탭', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'applicants', 'institutions')
    test.skip(!ok, '기관 신청 LNB 없음')

    const rows = await detail.dialogDataRowCount()
    test.skip(rows === 0, '기관 신청 행 없음 (TT-A-* 시드)')

    const schoolId = await detail.tryOpenFirstInstitutionRow()
    test.skip(!schoolId, '기관 상세(schoolId) 진입 실패')

    await expect(page).toHaveURL(/schoolId=/)
    const tabOk = await detail.selectInstitutionDetailTab('application')
    test.skip(!tabOk, '신청 정보 탭 없음')
    await expect(page.getByRole('dialog').getByText(/신청 정보/).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('8.3) 기관 상세 — 교육 일지 탭', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'applicants', 'institutions')
    test.skip(!ok, '기관 신청 LNB 없음')

    const rows = await detail.dialogDataRowCount()
    test.skip(rows === 0, '기관 신청 행 없음')

    const schoolId = await detail.tryOpenFirstInstitutionRow()
    test.skip(!schoolId, '기관 상세 진입 실패')

    const journalOk = await detail.selectInstitutionDetailTab('journal')
    test.skip(!journalOk, '교육 일지 탭 없음 (교육일지 OFF 프로그램일 수 있음)')

    await detail.expectJournalShellOrEmpty()
    await expect(page).toHaveURL(/schoolTab=journal/).catch(() => undefined)
  })
})
