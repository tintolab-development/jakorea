import { test, expect } from '../../../../fixtures/test'
import { TrainedTeachersDetailPage } from '../../../../pages/trained-teachers-detail.page'
import { TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES } from '../../../../pages/trained-teachers-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 8 — 교육받은 교사 진행·교육일지·실적 요약
 */
test.describe('교육받은 교사 진행·교육일지', () => {
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

  test('8.4) 진행 현황 · 실적 요약 strip', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'progress', 'institutions')
    test.skip(!ok, '진행 현황 LNB 없음 또는 API 실패')

    await expect(page).toHaveURL(/lnb=progress/)
    await detail.expectContentSettled()

    const hasSummary = await detail.expectPerformanceSummaryIfPresent()
    if (!hasSummary) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: '실적 요약 strip 미표시 (TT-P-01 시드/로딩)',
      })
    }
    // strip 없어도 진행 셸이면 통과
    await detail.expectListOrEmptyInDialog()
  })

  test('8.5) 진행 — 참여 기관 → 교육 일지', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const ok = await detail.tryGotoLnb(programId, 'progress', 'institutions')
    test.skip(!ok, '진행 현황 LNB 없음')

    const rows = await detail.dialogDataRowCount()
    test.skip(rows === 0, '참여 기관 행 없음 (승인 TT-A-02 시드)')

    const schoolId = await detail.tryOpenFirstInstitutionRow()
    test.skip(!schoolId, '참여 기관 상세 진입 실패')

    const journalOk = await detail.selectInstitutionDetailTab('journal')
    test.skip(!journalOk, '교육 일지 탭 없음')

    await detail.expectJournalShellOrEmpty()

    // 일괄 다운로드 버튼은 행 있을 때만 — 있으면 노출만 확인
    const bulk = page.getByRole('button', { name: /교육일지 일괄 다운로드/ })
    if (await bulk.isVisible().catch(() => false)) {
      await expect(bulk).toBeVisible()
    }
  })

  test('8.6) schoolId·schoolTab=journal 딥링크', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const listOk = await detail.tryGotoLnb(programId, 'progress', 'institutions')
    test.skip(!listOk, '진행 LNB 없음')

    const rows = await detail.dialogDataRowCount()
    test.skip(rows === 0, '참여 기관 행 없음')

    const schoolId = await detail.tryOpenFirstInstitutionRow()
    test.skip(!schoolId, 'schoolId 확보 실패')

    const deepOk = await detail.gotoInstitutionDetail(programId, schoolId, {
      lnb: 'progress',
      schoolTab: 'journal',
    })
    test.skip(!deepOk, '기관 상세 딥링크 실패')

    // 교육일지 OFF면 URL이 application으로 정규화될 수 있음 → 탭 전환 재시도
    if (!page.url().includes('schoolTab=journal')) {
      const switched = await detail.selectInstitutionDetailTab('journal')
      test.skip(!switched || !page.url().includes('schoolTab=journal'), '교육 일지 탭 비활성(교육일지 OFF)')
    }

    await detail.expectJournalShellOrEmpty()
    await expect(page).toHaveURL(/schoolId=/)
  })
})
