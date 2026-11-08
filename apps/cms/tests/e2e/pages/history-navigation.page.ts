import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/test'
import { expectSearchParams, historyIdx, historyLength } from '../helpers/history-stack'

/** Read-only common selectors. Never clicks checkboxes or action buttons in a row. */
export class HistoryNavigationPage {
  constructor(readonly page: Page, readonly route: string, readonly keys: readonly string[]) {}
  modal() { return this.page.locator('.ant-modal:visible').filter({ has: this.page.locator('.detail-fullpage-modal__close') }).last() }
  closeButton() { return this.modal().locator('.detail-fullpage-modal__close') }
  rows() { return this.page.locator('tr.ant-table-row:not(.ant-table-measure-row)') }
  async gotoList() {
    await this.page.goto(this.route)
    await expect(this.page.locator('.ant-table').first()).toBeVisible()
    await expect(this.page.locator('.ant-spin-spinning')).toHaveCount(0)
    await expect.poll(() => historyIdx(this.page)).toBeGreaterThanOrEqual(0)
  }
  async hasRows(minimum = 1) {
    await expect(this.rows().first().or(this.page.locator('.ant-table-placeholder, .ant-empty').first())).toBeVisible()
    if (await this.rows().count() >= minimum) return true
    test.info().annotations.push({ type: 'note', description: `${this.route}: 읽기 전용 목록 시드 ${minimum}행 미만 — 해당 경로 미실행` })
    return false
  }
  async open(index = 0) {
    await this.rows().nth(index).locator('td:not(.ant-table-selection-column)').last().click()
    await expect(this.page).toHaveURL(url => Boolean(url.searchParams.get(this.keys[0])))
    await expect(this.modal()).toBeVisible()
  }
  async expectIdx(idx: number) { await expect.poll(() => historyIdx(this.page)).toBe(idx) }
  async expectList(idx: number) {
    await expectSearchParams(this.page, Object.fromEntries(this.keys.map(key => [key, null])))
    await this.expectIdx(idx)
    await expect(this.modal()).toHaveCount(0)
  }
  async closeToList(idx: number, double = false) {
    const length = await historyLength(this.page)
    if (double) await this.closeButton().evaluate((button: HTMLElement) => { button.click(); button.click() })
    else await this.closeButton().click()
    await this.expectList(idx)
    expect(await historyLength(this.page)).toBeLessThanOrEqual(length)
  }
}
