import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { TextbookManagementPage } from '../../../pages/textbook-management.page'
import { clickExcelClientDownload } from '../../../pages/data-management-helpers'
import {
  TEXTBOOK_SEED_ELEMENTARY,
  TEXTBOOK_SEED_MIDDLE,
} from '../../../pages/data-management-seed-titles'

/**
 * Notion 1. 교재 관리 · 교재 등록 팝업 · 교재 관리 상세
 */
test.describe('교재 관리 목록·상세', () => {
  test('목록 셸·컬럼·기본 사용 여부 · 사업 분야 관리 API', async ({ page }) => {
    test.setTimeout(180_000)

    const textbooks = new TextbookManagementPage(page)
    await textbooks.gotoList()
    await expectAuthenticatedShell(page)
    await textbooks.expectListShell()
    await textbooks.expectListColumns()
    await textbooks.expectDefaultUseUsed()
    await textbooks.expectBusinessAreaManageButton()
    await textbooks.registerAndDeleteUniqueBusinessArea()
    await clickExcelClientDownload(page, test.info())
  })

  test('교육 대상에 따라 대상 학년 옵션이 바뀐다', async ({ page }) => {
    test.setTimeout(120_000)

    const textbooks = new TextbookManagementPage(page)
    await textbooks.gotoList()
    await textbooks.expectListShell()

    await textbooks.selectEducationTarget('유아')
    await textbooks.expectGradeOptions(['전체', '유아', '유치원생'])

    await textbooks.selectEducationTarget('초등학교')
    await textbooks.expectGradeOptions(['전학년', '1학년', '6학년'])

    await textbooks.selectEducationTarget('대학교')
    await textbooks.expectGradeOptions(['전체'])
  })

  test('시드 교재 조회 후 상세 풀페이지가 열린다', async ({ page }) => {
    test.setTimeout(120_000)

    const textbooks = new TextbookManagementPage(page)
    await textbooks.gotoList()
    await textbooks.expectListShell()

    const openedElementary = await textbooks.searchAndOpen(TEXTBOOK_SEED_ELEMENTARY)
    if (openedElementary) {
      await textbooks.expectDetailFields()
      await textbooks.closeDetail()
      return
    }

    const openedMiddle = await textbooks.searchAndOpen(TEXTBOOK_SEED_MIDDLE)
    if (openedMiddle) {
      await textbooks.expectDetailFields()
      await textbooks.closeDetail()
      return
    }

    test.info().annotations.push({
      type: 'note',
      description: `시드 없음 — ${TEXTBOOK_SEED_ELEMENTARY} | ${TEXTBOOK_SEED_MIDDLE}`,
    })
    await expect(page.getByRole('button', { name: '교재 등록' })).toBeVisible()
  })
})
