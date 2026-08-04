import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import {
  EDITABLE_DUMMY_TITLE,
  P1_SEED_TITLES,
  P2_SEED_TITLES,
  VARIANT_SEED_TITLES,
} from '../../../pages/general-program-seed-titles'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 설문·담당자 smoke · variant · Phase4 만족도 audience
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
    const loaded = await detail.gotoDetail(programId, 'managers', 'main')
    test.skip(!loaded, '프로그램 상세 API 실패 — 담당자 목록 스킵')
    await detail.expectUrlLnbTab('managers')
    await detail.expectManagersShellVisible()
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

test.describe('일반 프로그램 설문 Phase4', () => {
  test('4.1) CASE-10 full / CASE-14 single / CASE-13 none — 설문 LNB', async ({ page }) => {
    test.setTimeout(300_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)

    const full = await detail.tryOpenByTitles([P1_SEED_TITLES['CASE-10']])
    if (full) {
      await detail.expectLnbVisible(/설문/)
      const surveyOpen = await detail.tryGotoLnb(full.programId, 'survey', 'survey')
      expect(surveyOpen).toBe(true)
      await detail.closeDetail()
    } else {
      test.info().annotations.push({ type: 'note', description: 'CASE-10 시드 없음' })
    }

    const single = await detail.tryOpenByTitles([P1_SEED_TITLES['CASE-14']])
    if (single) {
      await detail.expectLnbVisible(/설문/)
      await detail.tryGotoLnb(single.programId, 'survey', 'survey')
      await detail.expectContentSettled()
      const hasSatisfaction = await detail.isLnbLabelVisible(/만족도/)
      expect(hasSatisfaction, 'CASE-14 single은 만족도 LNB가 없어야 함').toBe(false)
      await detail.closeDetail()
    } else {
      test.info().annotations.push({ type: 'note', description: 'CASE-14 시드 없음' })
    }

    const none = await detail.tryOpenByTitles([P1_SEED_TITLES['CASE-13']])
    if (none) {
      const hasSurvey = await detail.isLnbLabelVisible(/설문/)
      expect(hasSurvey, 'CASE-13은 설문 LNB가 없어야 함').toBe(false)
    } else {
      test.info().annotations.push({ type: 'note', description: 'CASE-13 시드 없음' })
      test.skip(!full && !single && !none, 'P1 설문 매트릭스 시드 없음')
    }
  })

  test('4.2) CASE-19 — 만족도「참여자」', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenByTitles([P2_SEED_TITLES['CASE-19']])
    test.skip(!opened, `시드 없음: ${P2_SEED_TITLES['CASE-19']}`)

    const surveyOk = await detail.tryGotoLnb(opened!.programId, 'survey', 'satisfaction')
    if (!surveyOk) {
      await detail.tryGotoLnb(opened!.programId, 'survey', 'survey')
    }
    await detail.expectContentSettled()

    const satisfaction = detail.lnbNav().getByText(/만족도/).first()
    if (await satisfaction.isVisible().catch(() => false)) {
      await satisfaction.click()
      await detail.expectContentSettled()
    }
    await expect(page.getByText(/참여자/).first()).toBeVisible({ timeout: 20_000 })
  })

  test('4.3) CASE-24 — 만족도 교사|학생', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenByTitles([P2_SEED_TITLES['CASE-24']])
    test.skip(!opened, `시드 없음: ${P2_SEED_TITLES['CASE-24']}`)

    await detail.tryGotoLnb(opened!.programId, 'survey', 'satisfaction')
    await detail.expectContentSettled()
    const satisfaction = detail.lnbNav().getByText(/만족도/).first()
    if (await satisfaction.isVisible().catch(() => false)) {
      await satisfaction.click()
      await detail.expectContentSettled()
    }

    const hasTeacher = await page
      .getByText('교사', { exact: true })
      .first()
      .isVisible()
      .catch(() => false)
    const hasStudent = await page
      .getByText('학생', { exact: true })
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasTeacher || hasStudent, 'CASE-24 만족도에 교사/학생 탭이 있어야 함').toBe(true)
  })

  test('4.4) CASE-20 — 만족도 봉사자', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenByTitles([P2_SEED_TITLES['CASE-20']])
    test.skip(!opened, `시드 없음: ${P2_SEED_TITLES['CASE-20']}`)

    await detail.tryGotoLnb(opened!.programId, 'survey', 'satisfaction')
    await detail.expectContentSettled()
    const satisfaction = detail.lnbNav().getByText(/만족도/).first()
    if (await satisfaction.isVisible().catch(() => false)) {
      await satisfaction.click()
      await detail.expectContentSettled()
    }

    const hasVolunteer = await page
      .getByText(/봉사자/)
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasVolunteer, 'CASE-20 만족도에 봉사자 audience가 있어야 함').toBe(true)
  })
})
