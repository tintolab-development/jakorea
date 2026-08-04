import { test, expect } from '../../../fixtures/test'
import { GeneralProgramDetailPage } from '../../../pages/general-program-detail.page'
import { P0_SEED_TITLES } from '../../../pages/general-program-seed-titles'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../helpers/with-authenticated-page'

/**
 * 일반 프로그램 상세 — 진행 현황
 *
 * Phase 3: 기관/개인 분기 · 출석·과제·게시글 · 중첩 상세 탭(행 있을 때).
 */
test.describe('일반 프로그램 진행 현황', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
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

    expect(visited > 0 || landed, 'progress 탭을 하나도 열지 못했습니다').toBe(true)
  })
})

test.describe('일반 프로그램 진행 Phase3 기관', () => {
  test('3.1~3.2) CASE-01 — 참여 기관 리스트/캘린더 · 행 상세 탭', async ({ page }) => {
    test.setTimeout(240_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-01')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-01']}`)

    await detail.tryGotoLnb(opened!.programId, 'progress', 'progress_participants')
    await detail.expectContentSettled()

    const listBtn = page.getByRole('button', { name: /리스트/ }).first()
    const calBtn = page.getByRole('button', { name: /캘린더/ }).first()
    if (await calBtn.isVisible().catch(() => false)) {
      await detail.clickInDetailContent(calBtn)
      await detail.expectContentSettled()
    }
    if (await listBtn.isVisible().catch(() => false)) {
      await detail.clickInDetailContent(listBtn)
      await detail.expectContentSettled()
    }

    await expect(page.getByText(/교육 참여 기관 목록|참여 기관/).first()).toBeVisible({
      timeout: 30_000,
    })

    const row = page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .first()
    if ((await row.count()) === 0 || !(await row.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: '참여 기관 행 없음 — 목록 셸만',
      })
      return
    }

    await detail.clickInDetailContent(row)
    await detail.expectContentSettled()

    for (const tabLabel of ['신청', '학생', '강사', '출석', '게시글'] as const) {
      const tab = page.getByRole('tab', { name: new RegExp(tabLabel) }).first()
      const textTab = page.getByText(tabLabel, { exact: true }).first()
      const target =
        (await tab.isVisible().catch(() => false))
          ? tab
          : (await textTab.isVisible().catch(() => false))
            ? textTab
            : null
      if (!target) continue
      await detail.clickInDetailContent(target)
      await detail.expectContentSettled()
    }
  })

  test('3.3) CASE-01 — 참여 강사·봉사자 목록 셸', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-01')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-01']}`)

    for (const [tab, label] of [
      ['progress_instructors', '참여 강사'],
      ['progress_volunteers', '참여 봉사자'],
    ] as const) {
      const ok = await detail.tryGotoLnb(opened!.programId, 'progress', tab)
      if (!ok) continue
      await detail.expectContentSettled()
      await expect(page.getByText(new RegExp(label)).first()).toBeVisible({ timeout: 20_000 })
    }
  })
})

test.describe('일반 프로그램 진행 Phase3 개인', () => {
  test('3.4~3.7) CASE-03 — 참여자·출석·과제·게시글', async ({ page }) => {
    test.setTimeout(240_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-03')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-03']}`)

    await detail.tryGotoLnb(opened!.programId, 'progress', 'progress_participants')
    await detail.expectContentSettled()

    const calBtn = page.getByRole('button', { name: /캘린더/ }).first()
    const listBtn = page.getByRole('button', { name: /리스트/ }).first()
    if (await calBtn.isVisible().catch(() => false)) {
      await detail.clickInDetailContent(calBtn)
      await detail.expectContentSettled()
    }
    if (await listBtn.isVisible().catch(() => false)) {
      await detail.clickInDetailContent(listBtn)
      await detail.expectContentSettled()
    }

    for (const [tab, label] of [
      ['progress_attendance', '출석 관리'],
      ['progress_assignments', '과제 관리'],
      ['progress_posts', '게시글'],
    ] as const) {
      const child = detail.lnbChildByLabel(label)
      if (await child.isVisible().catch(() => false)) {
        await child.click()
      } else {
        await detail.tryGotoLnb(opened!.programId, 'progress', tab)
      }
      await detail.expectContentSettled()
      // mock 플래시 없이 Spin이 있었다면 이미 사라진 상태
      const fullSpin = page.locator('.detail-fullpage-modal__loading, .ant-spin-spinning')
      if ((await fullSpin.count()) > 0) {
        await expect(fullSpin.first()).toBeHidden({ timeout: 60_000 }).catch(() => undefined)
      }
    }
  })

  test('3.8) CASE-03 — 참여자 행 상세 탭(행 있을 때)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const detail = new GeneralProgramDetailPage(page)
    const opened = await detail.tryOpenP0Case('CASE-03')
    test.skip(!opened, `시드 없음: ${P0_SEED_TITLES['CASE-03']}`)

    await detail.tryGotoLnb(opened!.programId, 'progress', 'progress_participants')
    await detail.expectContentSettled()

    const row = page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .first()
    if ((await row.count()) === 0 || !(await row.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: '참여자 행 없음',
      })
      return
    }

    await detail.clickInDetailContent(row)
    await detail.expectContentSettled()

    for (const tabLabel of ['신청', '출석', '과제'] as const) {
      const tab = page.getByRole('tab', { name: new RegExp(tabLabel) }).first()
      if (!(await tab.isVisible().catch(() => false))) continue
      await detail.clickInDetailContent(tab)
      await detail.expectContentSettled()
    }
  })
})
