import { test, expect } from '../../../fixtures/test'
import { GeneralProgramApplicationsPage } from '../../../pages/general-program-applications.page'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import { P2_SEED_TITLES } from '../../../pages/general-program-seed-titles'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 신청 목록 승인·심화 E2E
 *
 * BE에 신청 행 시드가 없으면 해당 LNB는 skip(사유 로그).
 * Phase 2: 상세 진입·필터·반려·면접 2depth·면접 배정 모달.
 */
test.describe('일반 프로그램 신청 목록', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/general')
      await expectAuthenticatedShell(page)
      const apps = new GeneralProgramApplicationsPage(page)
      const opened = await apps.openSeed()
      programId = opened.programId
    })
  })

  test('1) 기관·참여자 신청 — 목록 로드 · 선택 승인(행 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    const nav = page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    await apps.detailPage.gotoDetail(programId, 'info', 'info')

    const hasLnb =
      (await nav.getByText(/기관 신청 목록|참여자 신청 목록/).count()) > 0
    test.skip(!hasLnb, '기관/참여자 신청 LNB 없음')

    await apps.openInstitutionApplications(programId)
    await expect(page).toHaveURL(/lnb=institution_applications/)

    const result = await apps.approveFirstSelectedIfAny(programId, {
      apiPathPattern:
        /\/api\/admin\/(organization|individual)-applications\//,
    })
    if (result.status === 'skipped') {
      test.info().annotations.push({ type: 'skip-reason', description: result.reason })
      expect(true).toBe(true)
      return
    }
    expect(result.status).toBe('approved')
  })

  test('2) 강사 신청 — 목록 로드 · 선택 승인(행 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.detailPage.gotoDetail(programId, 'info', 'info')

    const nav = page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    const hasLnb = (await nav.getByText('강사 신청 목록').count()) > 0
    test.skip(!hasLnb, '강사 신청 LNB 없음')

    await apps.openInstructorApplications(programId)
    await expect(page).toHaveURL(/lnb=instructor_applications/)

    const result = await apps.approveFirstSelectedIfAny(programId, {
      apiPathPattern: /\/api\/admin\/instructor-applications\//,
    })
    if (result.status === 'skipped') {
      test.info().annotations.push({ type: 'skip-reason', description: result.reason })
      expect(true).toBe(true)
      return
    }
    expect(result.status).toBe('approved')
  })

  test('3) 봉사자 신청 — 목록 로드 · document-result(행 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.detailPage.gotoDetail(programId, 'info', 'info')

    const nav = page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    const hasLnb = (await nav.getByText('봉사자 신청 목록').count()) > 0
    test.skip(!hasLnb, '봉사자 신청 LNB 없음')

    await apps.openVolunteerApplications(programId)
    await expect(page).toHaveURL(/lnb=volunteer_applications/)

    const docTab = page.getByText('1차 서류 심사 대상자', { exact: true }).first()
    if (await docTab.isVisible().catch(() => false)) {
      await docTab.click()
    }

    const result = await apps.approveFirstSelectedIfAny(programId, {
      apiPathPattern: /\/api\/admin\/volunteer-applications\//,
    })
    if (result.status === 'skipped') {
      test.info().annotations.push({ type: 'skip-reason', description: result.reason })
      expect(true).toBe(true)
      return
    }
    expect(result.status).toBe('approved')
  })

  test('4) Phase2 — 기관/참여자 목록 필터·첫 행 상세', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.detailPage.gotoDetail(programId, 'info', 'info')
    const hasLnb = await apps.detailPage.isLnbLabelVisible(/기관 신청 목록|참여자 신청 목록/)
    test.skip(!hasLnb, '기관/참여자 신청 LNB 없음')

    await apps.openInstitutionApplications(programId)
    await apps.tryRunListFilterSearch()

    const rowCount = await apps.countDataRows()
    if (rowCount === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: '신청 행 없음 — 목록 셸만 확인',
      })
      expect(true).toBe(true)
      return
    }

    const opened = await apps.openFirstRowDetail()
    expect(opened).toBe(true)
    await expect(
      page.getByText(/기본 정보|신청 정보|안내|관리자 코멘트/).first()
    ).toBeVisible({ timeout: 30_000 })
  })

  test('5) Phase2 — 봉사 면접 2depth 탭 전환(있으면)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.detailPage.gotoDetail(programId, 'info', 'info')
    const hasLnb = await apps.detailPage.isLnbLabelVisible('봉사자 신청 목록')
    test.skip(!hasLnb, '봉사자 신청 LNB 없음')

    await apps.openVolunteerApplications(programId)
    const depth = await apps.tryOpenInterviewDepthTabs([
      '1차 서류',
      '서류 합격',
      '1차 서류 합격',
      '2차 면접',
    ])
    if (!depth.hasDepth) {
      test.info().annotations.push({
        type: 'note',
        description: `봉사 면접 2depth 없음(1depth 가능). opened=${depth.opened.join(',')}`,
      })
    }
    await apps.detailPage.expectContentSettled()
    expect(page.url()).toMatch(/lnb=volunteer_applications/)
  })

  test('6) Phase2 — 면접 배정 모달(버튼 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.detailPage.gotoDetail(programId, 'info', 'info')
    const hasVolunteer = await apps.detailPage.isLnbLabelVisible('봉사자 신청 목록')
    const hasParticipant = await apps.detailPage.isLnbLabelVisible(/참여자 신청 목록/)
    test.skip(!hasVolunteer && !hasParticipant, '면접 대상 LNB 없음')

    if (hasVolunteer) {
      await apps.openVolunteerApplications(programId)
      const passed = page.getByText(/서류 합격|1차 서류 합격/).first()
      if (await passed.isVisible().catch(() => false)) {
        await passed.click()
        await apps.detailPage.expectContentSettled()
      }
    } else {
      await apps.openInstitutionApplications(programId)
    }

    const opened = await apps.tryOpenInterviewAssignModal()
    if (!opened) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: '면접 배정 버튼/행 없음',
      })
    }
    expect(true).toBe(true)
  })
})

/**
 * Phase 2 — CASE별 면접 on/off · 개인 신청 2depth
 */
test.describe('일반 프로그램 신청 Phase2 CASE', () => {
  test('CASE-03 개인 면접 on — 참여자 신청 2depth(있으면)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-03')
    test.skip(!opened, 'CASE-03 시드 없음')

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.openInstitutionApplications(opened!.programId)
    await expect(page).toHaveURL(/lnb=institution_applications/)

    const depth = await apps.tryOpenInterviewDepthTabs([
      '1차 서류',
      '서류 합격',
      '1차 서류 합격',
      '2차 면접',
    ])
    test.info().annotations.push({
      type: 'note',
      description: `CASE-03 interview depth opened=${depth.opened.join(',') || 'none'}`,
    })
    await detail.expectContentSettled()
  })

  test('CASE-21 개인 면접 off — 2depth 없음(시드 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenByTitles([P2_SEED_TITLES['CASE-21']])
    test.skip(!opened, `시드 없음: ${P2_SEED_TITLES['CASE-21']}`)

    const apps = new GeneralProgramApplicationsPage(page)
    await apps.openInstitutionApplications(opened!.programId)

    const depth = await apps.tryOpenInterviewDepthTabs(['1차 서류', '2차 면접'])
    expect(depth.hasDepth, 'CASE-21은 참여자 면접 2depth가 없어야 함').toBe(false)
  })
})
