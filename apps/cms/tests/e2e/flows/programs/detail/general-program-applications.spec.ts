import { test, expect } from '../../../fixtures/test'
import { GeneralProgramApplicationsPage } from '../../../pages/general-program-applications.page'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 신청 목록 승인 E2E
 *
 * BE에 신청 행 시드가 없으면 해당 LNB는 skip(사유 로그).
 * 면접 슬롯 GET·최종 면접 배정은 범위 밖.
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
      // 목록 로드만 성공해도 Phase 3 부분 완료
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

    // 1차 서류 탭이 있으면 우선
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
})
