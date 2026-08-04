import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import { P0_SEED_TITLES } from '../../../pages/general-program-seed-titles'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'

/**
 * Phase 1 — P0 유형·LNB 잠금 (기관 vs 개인)
 *
 * BE에 CASE-01~09 title 시드가 없으면 해당 test skip.
 * @see apps/cms/docs/api/general-program-dummy-seed-backend-request.md §9 P0
 */
test.describe('일반 프로그램 P0 variant LNB', () => {
  test('1.1) CASE-01 기관 — 기관 신청·참여 기관 LNB, 출석/과제 없음', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-01')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-01']}`)

    await detail.expectLnbVisible(/기관 신청 목록/)
    await detail.expectLnbHidden(/참여자 신청 목록/)

    await detail.expectProgressTabLabels({
      mustHave: ['참여 기관'],
      mustNotHave: ['출석 관리', '과제 관리'],
    })
  })

  test('1.2) CASE-03 개인 — 참여자 신청·출석·과제·게시글, 기관 신청 없음', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-03')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-03']}`)

    await detail.expectLnbVisible(/참여자 신청 목록/)
    await detail.expectLnbHidden(/기관 신청 목록/)

    await detail.expectProgressTabLabels({
      mustHave: ['참여자', '출석 관리', '과제 관리', '게시글'],
      mustNotHave: ['참여 기관'],
    })
  })

  test('1.3) CASE-05 기관 일정형 — 기관 LNB', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-05')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-05']}`)

    await detail.expectLnbVisible(/기관 신청 목록/)
    await detail.expectProgressTabLabels({
      mustHave: ['참여 기관'],
      mustNotHave: ['출석 관리', '과제 관리'],
    })
  })

  test('1.4) CASE-07 개인 일정형 — 개인 progress LNB', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-07')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-07']}`)

    await detail.expectLnbVisible(/참여자 신청 목록/)
    await detail.expectProgressTabLabels({
      mustHave: ['참여자', '출석 관리', '과제 관리', '게시글'],
    })
  })

  test('1.5) CASE-02 multi vs CASE-01 single — 공통정보 회차 표기', async ({ page }) => {
    test.setTimeout(240_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const multi = await detail.tryOpenP0Case('CASE-02')
    test.skip(!multi, `시드 없음: ${P0_SEED_TITLES['CASE-02']}`)

    const multiHasRounds = await detail.expectCommonInfoHasMultiRoundMarkers()
    expect(multiHasRounds, 'CASE-02 복수 회차 공통정보에 회차/차시 표기가 있어야 함').toBe(true)
    await detail.closeDetail()

    const single = await detail.tryOpenP0Case('CASE-01')
    test.skip(!single, `시드 없음: ${P0_SEED_TITLES['CASE-01']}`)
    // single도 「회차」문구가 있을 수 있어, multi가 열린 것만 필수로 단언
    await detail.goToInfoTab('info')
    await detail.expectContentSettled()
  })

  test('1.6) CASE-06 — 신청 정보에서 희망 일정 단락 숨김(가능하면)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-06')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-06']}`)

    await detail.goToInfoTab('application')
    await detail.expectContentSettled()

    // 신청 정보 미리보기/라벨에 「진행 희망 교육 일정」이 없어야 함 (브리지: schedule+multi)
    const hope = page.getByText('진행 희망 교육 일정')
    const hopeCount = await hope.count()
    if (hopeCount > 0) {
      // 미리보기 패널 밖(다른 탭 잔여)일 수 있어 visible만 검사
      const visible = await hope.first().isVisible().catch(() => false)
      expect(visible, 'CASE-06은 희망 일정 단락이 숨겨져야 함').toBe(false)
    }
  })

  test('1.7) CASE-09 — 회차별 교육형태·IPS 상이 표기(가능하면)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-09')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-09']}`)

    await detail.goToInfoTab('info')
    await detail.expectContentSettled()
    const body = page.locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body')
    const text = await body.first().innerText()
    const hasPerSchedule =
      /일정\s*별\s*상이|온라인|오프라인/.test(text) && /회차|IPS|교육\s*형태/.test(text)
    expect(
      hasPerSchedule,
      'CASE-09 공통정보에 회차별 교육형태/IPS(일정 별 상이) 흔적이 있어야 함'
    ).toBe(true)
  })
})
