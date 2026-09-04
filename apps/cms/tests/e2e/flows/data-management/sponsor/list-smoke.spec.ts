import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { SponsorManagementPage } from '../../../pages/sponsor-management.page'
import { clickExcelClientDownload, filterField } from '../../../pages/data-management-helpers'
import {
  SPONSOR_SEED_CORPORATE,
  SPONSOR_SEED_FOUNDATION,
} from '../../../pages/data-management-seed-titles'

/**
 * Notion 1. 후원사 관리 — 목록 셸·컬럼·필터·시드 행
 *
 * 시드가 없으면 목록 셸만 통과하고 annotation.
 */
test.describe('후원사 관리 목록', () => {
  test('목록 셸·컬럼·기본 구분(기업) · 갭 컬럼 없음', async ({ page }) => {
    test.setTimeout(120_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await expectAuthenticatedShell(page)
    await sponsors.expectListShell()
    await sponsors.expectListColumns()
    await sponsors.expectDefaultKindCorporate()
    await sponsors.expectDateRangeFilter()
    const statusField = filterField(page, '후원 상태')
    await statusField.locator('.ant-select-selector, [role="combobox"]').first().click()
    await expect(page.getByTitle('후원 중').or(page.getByText('후원 중', { exact: true })).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByTitle('후원 논의중').or(page.getByText('후원 논의중', { exact: true }))).toHaveCount(0)
    await expect(page.getByTitle('후원 휴면').or(page.getByText('후원 휴면', { exact: true }))).toHaveCount(0)
    await expect(page.getByTitle('후원 종료').or(page.getByText('후원 종료', { exact: true })).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await clickExcelClientDownload(page, test.info())
  })

  test('조회 전에는 후원사명 입력이 URL에 반영되지 않는다', async ({ page }) => {
    test.setTimeout(120_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await sponsors.expectListShell()
    await sponsors.fillListName(SPONSOR_SEED_CORPORATE)
    await expect(page).not.toHaveURL(/sp_name=/)
    await sponsors.search()
    await expect(page).toHaveURL(/sp_name=/)
  })

  test('기업 필터에서 스타벅스 · 재단 필터에서 제이에이코리아', async ({ page }) => {
    test.setTimeout(120_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await sponsors.expectListShell()

    await sponsors.selectKind('기업')
    await sponsors.fillListName(SPONSOR_SEED_CORPORATE)
    await sponsors.search()
    const corporateFound = await sponsors.tryFind(SPONSOR_SEED_CORPORATE)
    if (!corporateFound) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 기업 후원사 ${SPONSOR_SEED_CORPORATE}`,
      })
    }

    await sponsors.selectKind('재단')
    await sponsors.fillListName(SPONSOR_SEED_FOUNDATION)
    await sponsors.search()
    const foundationFound = await sponsors.tryFind(SPONSOR_SEED_FOUNDATION)
    if (!foundationFound) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 재단 후원사 ${SPONSOR_SEED_FOUNDATION}`,
      })
    }

    if (!corporateFound && !foundationFound) {
      await expect(page.getByRole('button', { name: '후원사 등록' })).toBeVisible()
    }
  })

  test('프로그램이 있는 시드 행 목록 삭제는 문구 입력 없이 차단된다', async ({ page }) => {
    test.setTimeout(120_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await sponsors.expectListShell()
    await sponsors.selectKind('기업')
    await sponsors.fillListName(SPONSOR_SEED_CORPORATE)
    await sponsors.search()

    const found = await sponsors.tryFind(SPONSOR_SEED_CORPORATE)
    if (!found) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 삭제 차단 스킵 (${SPONSOR_SEED_CORPORATE})`,
      })
      return
    }

    await sponsors.openListDeleteForRow(SPONSOR_SEED_CORPORATE)
    await sponsors.expectListDeleteHasNoTypedConfirm()
    await sponsors.confirmListDeleteWithoutTyping()
    await sponsors.expectDeleteBlocked()
    await expect(sponsors.dataRows().filter({ hasText: SPONSOR_SEED_CORPORATE }).first()).toBeVisible()
  })
})
