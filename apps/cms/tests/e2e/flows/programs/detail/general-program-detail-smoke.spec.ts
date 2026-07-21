import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 smoke — LNB·탭·딥링크
 *
 * 시드: CASE-10 FULL LNB 우선, 없으면 `[수정 가능] 일반 프로그램 더미`
 * 각 테스트는 programId를 beforeAll에서 확보한 뒤 독립 goto.
 */
test.describe('일반 프로그램 상세 smoke', () => {
  let programId = ''
  let usedFullLnbSeed = false

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/general')
      await expectAuthenticatedShell(page)
      const detail = new GeneralProgramDetailPage(page)
      const opened = await detail.openPreferredDetailSeed()
      programId = opened.programId
      usedFullLnbSeed = opened.usedFullLnbSeed
    })
  })

  test('1) 상세 셸·공통 정보 탭', async ({ page }) => {
    test.setTimeout(120_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')
    await detail.expectUrlLnbTab('info', 'info')
    await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible()
    await detail.expectContentSettled()
  })

  test('2) 정보 LNB — 공통·모집·신청 탭 URL 동기화', async ({ page }) => {
    test.setTimeout(120_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')

    await detail.goToInfoTab('recruitment')
    await detail.expectUrlLnbTab('info', 'recruitment')
    await expect(page.getByText('모집 정보', { exact: true }).first()).toBeVisible()

    await detail.goToInfoTab('application')
    await detail.expectUrlLnbTab('info', 'application')
    await expect(
      page.getByText('현재 화면은 양식 미리보기 화면입니다.').first()
    ).toBeVisible({ timeout: 30_000 })

    await detail.goToInfoTab('info')
    await detail.expectUrlLnbTab('info', 'info')
  })

  test('3) 신청·진행·설문·담당자 LNB (보이는 항목만)', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')

    const opened: string[] = []

    // 딥링크 우선 — 아코디언 부모 클릭만으로는 URL이 안 바뀜
    const candidates: Array<{ lnb: Parameters<GeneralProgramDetailPage['tryGotoLnb']>[1]; tab: string }> =
      [
        { lnb: 'institution_applications', tab: 'main' },
        { lnb: 'instructor_applications', tab: 'main' },
        { lnb: 'volunteer_applications', tab: 'vol_all' },
        { lnb: 'progress', tab: 'progress_participants' },
        { lnb: 'survey', tab: 'survey' },
        { lnb: 'managers', tab: 'main' },
      ]

    for (const { lnb, tab } of candidates) {
      const ok = await detail.tryGotoLnb(programId, lnb, tab)
      if (!ok) continue
      opened.push(lnb)
      if (lnb === 'managers') {
        await expect(page.getByText('담당자 목록').first()).toBeVisible({ timeout: 30_000 })
      }
    }

    expect(
      opened.length,
      usedFullLnbSeed
        ? `FULL LNB 시드인데 열린 LNB가 없습니다: ${opened.join(',')}`
        : '수정 더미에서 추가 LNB가 하나도 열리지 않았습니다'
    ).toBeGreaterThan(0)
  })

  test('4) 딥링크로 동일 URL 복원', async ({ page }) => {
    test.setTimeout(120_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'application')
    await detail.expectUrlLnbTab('info', 'application')
    await expect(
      page.getByText('현재 화면은 양식 미리보기 화면입니다.').first()
    ).toBeVisible({ timeout: 30_000 })

    await page.reload()
    await expectAuthenticatedShell(page)
    await detail.expectDetailShellReady()
    await detail.expectUrlLnbTab('info', 'application')
  })
})
