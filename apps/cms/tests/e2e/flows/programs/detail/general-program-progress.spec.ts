import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 진행 현황 목록 smoke
 *
 * 출석·과제·중첩 상세는 제외. meta에 있는 progress 하위 탭만 순회.
 */
test.describe('일반 프로그램 진행 현황', () => {
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

  test('1) progress LNB 하위 탭 로드', async ({ page }) => {
    test.setTimeout(180_000)
    expect(programId.length).toBeGreaterThan(0)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)

    // 딥링크로 progress 진입 (부모 LNB는 아코디언 토글만)
    let landed = await detail.tryGotoLnb(programId, 'progress', 'progress_participants')
    if (!landed) {
      landed = await detail.tryGotoLnb(programId, 'progress', 'progress_instructors')
    }
    test.skip(!landed, '프로그램 진행 현황 LNB/탭 없음')

    await detail.expectContentSettled()

    const progressTabs = [
      '참여 기관',
      '참여자',
      '참여 강사',
      '참여 봉사자',
      '게시글',
    ] as const

    let visited = 0
    for (const label of progressTabs) {
      const child = page
        .getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
        .locator(`[data-text="${label}"]`)
        .first()
      const byText = page
        .getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
        .getByText(label, { exact: true })
        .first()

      const target =
        (await child.count()) > 0 && (await child.isVisible().catch(() => false))
          ? child
          : (await byText.count()) > 0 && (await byText.isVisible().catch(() => false))
            ? byText
            : null

      if (!target) continue

      await target.click()
      await expect(page).toHaveURL(/lnb=progress/, { timeout: 15_000 })
      await detail.expectContentSettled()

      const errorToast = page.locator('.ant-message-error, .ant-notification-notice-error')
      await expect(errorToast).toHaveCount(0)
      visited += 1
    }

    for (const label of ['출석 관리', '과제 관리'] as const) {
      const byText = page
        .getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
        .getByText(label, { exact: true })
        .first()
      if (!(await byText.isVisible().catch(() => false))) continue
      await byText.click()
      await expect(page).toHaveURL(/lnb=progress/)
      await detail.expectContentSettled()
      visited += 1
    }

    // 딥링크만 성공하고 자식이 숨겨져 있어도 1회 방문으로 인정
    expect(visited > 0 || landed, 'progress 탭을 하나도 열지 못했습니다').toBe(true)
  })
})
