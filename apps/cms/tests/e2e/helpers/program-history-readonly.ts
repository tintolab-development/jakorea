import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/test'
import { historyIdx } from './history-stack'

/** Inspect current-page programs read-only. A named sponsor without its link is a UI failure. */
export async function findSponsoredProgram(page: Page, listIdx: number) {
  const rows = page.locator('tbody.ant-table-tbody tr.ant-table-row')
  const count = await rows.count()
  for (let index = 0; index < count; index++) {
    await rows.nth(index).click()
    await expect(page).toHaveURL(/[?&]programId=/)
    await expect.poll(() => historyIdx(page)).toBe(listIdx + 1)
    const modal = page.getByRole('dialog').first()
    const field = modal.locator('.detail-info-form__field').filter({ has: page.locator('.detail-info-form__field-label').getByText('후원사', { exact: true }) }).first()
    await expect(field).toBeVisible({ timeout: 30_000 })
    const content = field.locator('.detail-info-form__field-content')
    if ((await content.innerText()).trim() !== '-') {
      const link = content.locator('button.program-detail-sponsor-link').first()
      await expect(link).toBeVisible()
      return link
    }
    await modal.locator('.detail-fullpage-modal__close').click()
    await expect(page).not.toHaveURL(/[?&]programId=/)
    await expect.poll(() => historyIdx(page)).toBe(listIdx)
  }
  test.info().annotations.push({ type: 'note', description: 'NOT EXECUTED — 현재 페이지 프로그램 모두 후원사 미배정(후원사 칸 "-"); 다른 페이지 시드는 미탐색' })
  return null
}
