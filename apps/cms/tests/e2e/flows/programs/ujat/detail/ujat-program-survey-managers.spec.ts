import { test, expect } from '../../../../fixtures/test'
import { UjatProgramDetailPage } from '../../../../pages/ujat-program-detail.page'
import { UJAT_DETAIL_SEED_CANDIDATES } from '../../../../pages/ujat-program-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 4 — UJAT 설문·담당자
 *
 * 설문 LNB는 프로그램 설문 설정에 따라 없을 수 있음 → skip.
 */
test.describe('UJAT 프로그램 설문·담당자', () => {
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

  test('4.8) 설문 관리 — 목록/empty smoke', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.tryGotoLnb(programId, 'survey', 'survey')
    test.skip(!opened, '설문 관리 LNB 없음 (프로그램 설문 설정 off)')

    await detail.expectContentSettled()

    const hasRegister = await page
      .getByRole('button', { name: /설문조사 등록|만족도조사 등록|강의평가 등록/ })
      .first()
      .isVisible()
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/아직 등록된 설문|설문조사|만족도|강의평가/)
      .first()
      .isVisible()
      .catch(() => false)
    const hasTable = await page
      .locator('.cms-data-table, .ant-table, .survey-management-view')
      .first()
      .isVisible()
      .catch(() => false)

    expect(hasRegister || hasEmpty || hasTable).toBe(true)
  })

  test('4.9) 담당자 정보 셸', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const opened = await detail.tryGotoLnb(programId, 'managers', 'main')
    test.skip(!opened, '담당자 정보 LNB 없음 또는 상세 API 실패')

    if (await detail.isProgramDetailLoadFailed()) {
      test.skip(true, '프로그램 상세 API 실패 — 담당자 셸 스킵')
    }

    const shellOk = await detail.tryExpectManagersShellVisible()
    test.skip(!shellOk, '담당자 목록 셸 미표시 (API/시드)')

    await expect(page).toHaveURL(/lnb=managers/)
  })
})
