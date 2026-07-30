import { test, expect } from '../../../fixtures/test'
import { TrainedTeachersDetailPage } from '../../../pages/trained-teachers-detail.page'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'

/**
 * Phase 7 — 교육받은 교사 목록 셸
 */
test.describe('교육받은 교사 목록 셸', () => {
  test.describe.configure({ mode: 'serial' })

  test('7.1) 목록 셸 · 신규 등록', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const tt = new TrainedTeachersDetailPage(page)
    await tt.expectListShell()
    await expect(page.getByText(/교육받은 교사/).first()).toBeVisible()
    await expect(page).toHaveURL(/\/programs\/trained-teachers/)
  })
})
