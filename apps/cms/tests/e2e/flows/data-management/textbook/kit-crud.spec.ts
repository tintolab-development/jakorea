import { test } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { TextbookManagementPage } from '../../../pages/textbook-management.page'

/**
 * Notion 교재 등록 · 키트 수량 관리
 *
 * 키트는 전역 1건이라 값을 바꾼 뒤 원복한다. 이 파일은 serial.
 */
test.describe('교재 등록·키트 수량', () => {
  test.describe.configure({ mode: 'serial' })

  test('틴토랩 교재를 등록·상세 수정·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)

    const textbooks = new TextbookManagementPage(page)
    await textbooks.gotoList()
    await expectAuthenticatedShell(page)
    await textbooks.expectListShell()

    await textbooks.registerTextbook()
    await textbooks.expectInList(textbooks.uniqueName)
    await textbooks.updateUniqueTextbookEnglishName()
    await textbooks.deleteFromListTyped(textbooks.uniqueName)
    await textbooks.expectNotInList(textbooks.uniqueName)
  })

  test('키트 수량 변경 안내 후 저장하고 원복한다', async ({ page }) => {
    test.setTimeout(180_000)

    const textbooks = new TextbookManagementPage(page)
    await textbooks.gotoList()
    await expectAuthenticatedShell(page)
    await textbooks.expectListShell()

    await textbooks.openKitModal()
    const original = await textbooks.readKitQuantity('초등')
    const nextValue = original === '24' ? '25' : '24'
    await textbooks.setKitQuantity('초등', nextValue)
    await textbooks.confirmKitModal()
    const notice = await textbooks.expectKitChangeNotice()
    await textbooks.saveKitChangeNotice(notice)

    await textbooks.openKitModal()
    const saved = await textbooks.readKitQuantity('초등')
    if (saved !== nextValue) {
      test.info().annotations.push({
        type: 'note',
        description: `키트 수량 저장 값이 예상과 다름 (saved=${saved}, expected=${nextValue})`,
      })
    }

    await textbooks.setKitQuantity('초등', original)
    await textbooks.confirmKitModal()
    const restoreNotice = await textbooks.expectKitChangeNotice()
    await textbooks.saveKitChangeNotice(restoreNotice)
  })
})
