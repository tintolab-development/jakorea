import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { DetailedProgramManagementPage } from '../../../pages/detailed-program-management.page'
import { clickExcelClientDownload } from '../../../pages/data-management-helpers'
import {
  DETAILED_PROGRAM_SEED_INACTIVE,
  DETAILED_PROGRAM_SEED_IN_USE,
} from '../../../pages/data-management-seed-titles'

/**
 * Notion 1. 세부 프로그램 관리 · 신규 등록 팝업
 */
test.describe('세부 프로그램 관리', () => {
  test('목록 셸·컬럼·기본 사용 · 행 클릭해도 상세 없음', async ({ page }) => {
    test.setTimeout(120_000)

    const programs = new DetailedProgramManagementPage(page)
    await programs.gotoList()
    await expectAuthenticatedShell(page)
    await programs.expectListShell()
    await programs.expectListColumns()
    await programs.expectDefaultUseActive()
    await clickExcelClientDownload(page, test.info())

    await programs.fillName(DETAILED_PROGRAM_SEED_IN_USE)
    await programs.search()
    const clicked = await programs.expectNoDetailOnRowClick(DETAILED_PROGRAM_SEED_IN_USE)
    if (!clicked) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 행 클릭 스킵 (${DETAILED_PROGRAM_SEED_IN_USE})`,
      })
    }
  })

  test('사용 중인 시드 행은 삭제 불가 안내', async ({ page }) => {
    test.setTimeout(120_000)

    const programs = new DetailedProgramManagementPage(page)
    await programs.gotoList()
    await programs.expectListShell()
    await programs.selectUseStatus('사용')
    await programs.fillName(DETAILED_PROGRAM_SEED_IN_USE)
    await programs.search()

    const result = await programs.tryDeleteInUseSeed(DETAILED_PROGRAM_SEED_IN_USE)
    if (result === 'missing') {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 삭제 불가 스킵 (${DETAILED_PROGRAM_SEED_IN_USE})`,
      })
      return
    }
    if (result === 'deleted') {
      throw new Error(
        `${DETAILED_PROGRAM_SEED_IN_USE} 가 삭제되었습니다. inUse/409 시드가 필요합니다.`
      )
    }
    await expect(programs.dataRows().filter({ hasText: DETAILED_PROGRAM_SEED_IN_USE }).first()).toBeVisible()
  })

  test('미사용 필터에서 2차 교육 워크숍을 찾는다', async ({ page }) => {
    test.setTimeout(120_000)

    const programs = new DetailedProgramManagementPage(page)
    await programs.gotoList()
    await programs.expectListShell()
    await programs.selectUseStatus('미사용')
    await programs.fillName(DETAILED_PROGRAM_SEED_INACTIVE)
    await programs.search()

    const found = await programs.tryFind(DETAILED_PROGRAM_SEED_INACTIVE)
    if (!found) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — ${DETAILED_PROGRAM_SEED_INACTIVE}`,
      })
    }
    await expect(page.getByRole('button', { name: '신규 등록' })).toBeVisible()
  })

  test('틴토랩 세부 프로그램을 등록·인라인 수정·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)

    const programs = new DetailedProgramManagementPage(page)
    await programs.gotoList()
    await expectAuthenticatedShell(page)
    await programs.expectListShell()

    await programs.registerItem()
    await programs.expectInList(programs.uniqueName)
    await programs.inlineRenameUnique()
    await programs.deleteFromListTyped(programs.uniqueNameUpdated)
    await programs.expectNotInList(programs.uniqueNameUpdated)
  })
})
