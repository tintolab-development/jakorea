import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { SponsorManagementPage } from '../../../pages/sponsor-management.page'
import { tableRows } from '../../../pages/data-management-helpers'

/**
 * 후원사 CRUD — 틴토랩-* 고유 행만 생성·수정·삭제. 시드 행은 건드리지 않는다.
 */
test.describe('후원사 관리 CRUD', () => {
  test('틴토랩 후원사를 등록·조회·수정·상태변경·담당자·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await expectAuthenticatedShell(page)
    await sponsors.expectListShell()
    await sponsors.selectKind('기업')

    await sponsors.registerSponsor()
    await sponsors.expectInList(sponsors.uniqueName)

    await sponsors.changeListStatus(sponsors.uniqueName, '후원 종료')
    await sponsors.changeListStatus(sponsors.uniqueName, '진행 중')

    await sponsors.openUniqueDetail()
    await sponsors.expectBasicInfoFields()
    await sponsors.expectYearlyPanel()
    await expect(page.getByRole('button', { name: '후원정보 수정' })).toBeVisible()

    await sponsors.updateUniqueName()
    await sponsors.closeDetail()
    await sponsors.expectInList(sponsors.uniqueNameUpdated)

    const reopened = await sponsors.searchAndOpen(sponsors.uniqueNameUpdated)
    expect(reopened, '수정한 후원사 상세를 다시 열 수 있어야 한다').toBe(true)
    await sponsors.clickLnb('후원사 담당자 정보')
    await sponsors.expectContactsShell()
    await sponsors.registerContact({
      type: 'lead',
      name: sponsors.uniqueContactName,
      email: `tintolab.e2e.lead.${Date.now()}@jakorea.test`,
      phone: '010-1234-5678',
    })
    await expect(tableRows(page).filter({ hasText: '주 담당자' })).toHaveCount(1)
    await sponsors.registerContact({
      type: 'assistant',
      name: sponsors.uniqueContactAssistantName,
      email: `tintolab.e2e.asst.${Date.now()}@jakorea.test`,
      phone: '010-1234-5679',
    })
    await expect(tableRows(page).filter({ hasText: '주 담당자' })).toHaveCount(1)
    await sponsors.promoteContactToLead(sponsors.uniqueContactAssistantName)
    await expect(
      tableRows(page).filter({ hasText: sponsors.uniqueContactAssistantName }).getByText('주 담당자', {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      tableRows(page).filter({ hasText: sponsors.uniqueContactName }).getByText('주 담당자', {
        exact: true,
      })
    ).toHaveCount(0)
    await sponsors.deleteContact(sponsors.uniqueContactName)
    await expect(tableRows(page).filter({ hasText: '주 담당자' })).toHaveCount(1)
    await expect(
      tableRows(page)
        .filter({ hasText: sponsors.uniqueContactAssistantName })
        .getByText('주 담당자', { exact: true })
    ).toBeVisible()

    await sponsors.clickLnb('후원사 상세 정보')
    await sponsors.deleteFromDetailTyped()
    await sponsors.expectNotInList(sponsors.uniqueNameUpdated)
  })
})
