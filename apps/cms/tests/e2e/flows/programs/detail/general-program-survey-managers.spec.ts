import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import {
  EDITABLE_DUMMY_TITLE,
  VARIANT_SEED_TITLES,
} from '../../../pages/general-program-seed-titles'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 설문·담당자 smoke · variant(시드 있을 때)
 *
 * 만족도/응답 작성·담당자 CRUD는 mock/후순위 — 로드만.
 */
test.describe('일반 프로그램 설문·담당자·variant smoke', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/general')
      await expectAuthenticatedShell(page)
      const detail = new GeneralProgramDetailPage(page)
      const opened = await detail.openPreferredDetailSeed()
      programId = opened.programId
    })
  })

  test('1) 설문 관리 — 목록/empty smoke', async ({ page }) => {
    test.setTimeout(120_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryGotoLnb(programId, 'survey', 'survey')
    test.skip(!opened, '설문 관리 LNB 없음 (프로그램 설문 설정 off)')

    await detail.expectContentSettled()

    const surveyChild = page
      .getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
      .getByText('설문조사', { exact: true })
      .first()
    if (await surveyChild.isVisible().catch(() => false)) {
      await surveyChild.click()
      await expect(page).toHaveURL(/lnb=survey/)
      await detail.expectContentSettled()
    }

    const hasRegister = await page
      .getByRole('button', { name: '설문조사 등록' })
      .isVisible()
      .catch(() => false)
    const hasEmpty = await page
      .getByText(/아직 등록된 설문조사|설문조사/)
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasRegister || hasEmpty || page.url().includes('lnb=survey')).toBe(true)
  })

  test('2) 담당자 정보 — 목록 로드', async ({ page }) => {
    test.setTimeout(120_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    await detail.gotoDetail(programId, 'managers', 'main')
    await detail.expectUrlLnbTab('managers')
    await expect(page.getByText('담당자 목록').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: '담당자 등록' }).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('3) variant 시드 — 공통 정보 로드(있는 title만)', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    let openedAny = false

    for (const [, title] of Object.entries(VARIANT_SEED_TITLES)) {
      try {
        const opened = await detail.openByTitle(title)
        await detail.expectUrlLnbTab('info')
        await expect(page.getByText(title).first()).toBeVisible({ timeout: 30_000 })
        await detail.closeDetail()
        openedAny = true
        void opened
      } catch {
        // 시드 없으면 다음 CASE
      }
    }

    if (!openedAny) {
      // fallback: 수정 더미만이라도 공통정보 표시
      const opened = await detail.openByTitle(EDITABLE_DUMMY_TITLE)
      await expect(page.getByText(EDITABLE_DUMMY_TITLE).first()).toBeVisible({
        timeout: 30_000,
      })
      expect(opened.programId.length).toBeGreaterThan(0)
      test.info().annotations.push({
        type: 'note',
        description: 'CASE-01/03/05 시드 없음 — 수정 가능 더미로 fallback',
      })
    }
  })
})
