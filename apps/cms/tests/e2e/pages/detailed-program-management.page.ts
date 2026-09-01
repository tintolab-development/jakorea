/**
 * 세부 프로그램 관리 POM — `/detailed-program`
 *
 * 행 클릭해도 상세 모달이 없다. 인라인 수정 + 신규 등록 팝업.
 */

import { type Page, expect } from '@playwright/test'
import { expectAuthenticatedShell } from '../helpers/authenticated-shell'
import {
  clickSearch,
  expectColumnTitles,
  fillTypedDeleteConfirm,
  filterField,
  isAdminMutation,
  selectRowCheckbox,
  tableRows,
  tryFindRow,
  waitForAdminGet,
} from './data-management-helpers'
import { DATA_MANAGEMENT_NAME_PREFIX } from './data-management-seed-titles'
import { fillByPlaceholder } from './form-helpers'

const LIST_COLUMNS = ['No.', '사용 여부', '세부 프로그램명', '등록자', '등록일시'] as const

export class DetailedProgramManagementPage {
  readonly uniqueName: string
  readonly uniqueNameUpdated: string

  constructor(private readonly page: Page) {
    const stamp = Date.now()
    this.uniqueName = `${DATA_MANAGEMENT_NAME_PREFIX}-세부-${stamp}`
    this.uniqueNameUpdated = `${DATA_MANAGEMENT_NAME_PREFIX}-세부-수정-${stamp}`
  }

  async gotoList() {
    await this.page.goto('/detailed-program')
  }

  async expectListShell() {
    await expectAuthenticatedShell(this.page)
    await expect(this.page.getByRole('menuitem', { name: '세부 프로그램 관리' })).toBeVisible()
    await expect(this.page.getByText('세부 프로그램 목록').first()).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: '항목 삭제' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '정보 수정' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '신규 등록' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '엑셀 다운로드' })).toBeVisible()
  }

  async expectListColumns() {
    await expectColumnTitles(this.page, LIST_COLUMNS)
  }

  async expectDefaultUseActive() {
    await expect(this.page).toHaveURL(/dp_use=active/, { timeout: 15_000 })
    await expect(
      filterField(this.page, '사용 여부').getByRole('radio', { name: '사용' })
    ).toBeChecked()
  }

  async selectUseStatus(label: '사용' | '미사용') {
    await filterField(this.page, '사용 여부').getByRole('radio', { name: label }).check({ force: true })
  }

  async fillName(name: string) {
    await this.page.getByPlaceholder('세부 프로그램명을 입력하세요').fill(name)
  }

  async search() {
    const pending = waitForAdminGet(this.page, '/api/admin/detailed-programs')
    await clickSearch(this.page)
    await pending
  }

  dataRows() {
    return tableRows(this.page)
  }

  async tryFind(name: string, timeoutMs = 8_000) {
    return tryFindRow(this.page, name, timeoutMs)
  }

  async expectNoDetailOnRowClick(name: string) {
    const found = await this.tryFind(name)
    if (!found) return false
    const beforeUrl = this.page.url()
    await this.dataRows().filter({ hasText: name }).first().click()
    await expect(this.page.getByRole('dialog').filter({ hasText: /상세/ })).toHaveCount(0)
    expect(this.page.url()).toBe(beforeUrl)
    return true
  }

  async registerItem() {
    await this.page.getByRole('button', { name: '신규 등록' }).click()
    const modal = this.page.getByRole('dialog').filter({ hasText: '항목 추가' })
    await expect(modal).toBeVisible()
    await modal.getByRole('radio', { name: '사용' }).check({ force: true })
    await fillByPlaceholder(modal, '세부 프로그램명을 입력해 주세요.', this.uniqueName)

    const createPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/detailed-programs\/?$/),
      { timeout: 60_000 }
    )
    await modal.getByRole('button', { name: '등록' }).click()
    const createResponse = await createPromise
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(
        `세부 프로그램 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`
      )
    }
    await expect(modal).toBeHidden({ timeout: 15_000 })
  }

  async expectInList(name: string) {
    await this.fillName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name }).first()).toBeVisible({ timeout: 30_000 })
  }

  async expectNotInList(name: string) {
    await this.fillName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name })).toHaveCount(0, { timeout: 30_000 })
  }

  async inlineRenameUnique() {
    await this.fillName(this.uniqueName)
    await this.search()
    await this.page.getByRole('button', { name: '정보 수정' }).click()
    const row = this.dataRows().filter({ hasText: this.uniqueName }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    const nameInput = row.getByPlaceholder('세부 프로그램명')
    await expect(nameInput).toBeVisible()
    await nameInput.fill(this.uniqueNameUpdated)

    const patchPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'PATCH', /\/api\/admin\/detailed-programs\/[^/]+\/?$/),
      { timeout: 60_000 }
    )
    await this.page.getByRole('button', { name: '정보 수정' }).click()
    const patch = await patchPromise
    if (!patch.ok()) {
      const body = await patch.text().catch(() => '')
      throw new Error(
        `세부 프로그램 수정 API 실패: HTTP ${patch.status()} ${body.slice(0, 400)}`
      )
    }
    await expect(this.page.getByRole('button', { name: '정보 수정' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(this.dataRows().filter({ hasText: this.uniqueNameUpdated }).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  async deleteFromListTyped(name: string) {
    await this.fillName(name)
    await this.search()
    await selectRowCheckbox(this.page, name)
    await this.page.getByRole('button', { name: '항목 삭제' }).click()
    const guide = this.page.getByRole('dialog').filter({ hasText: '세부 프로그램 삭제' })
    await expect(guide).toBeVisible()
    await fillTypedDeleteConfirm(guide)

    const deletePromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/detailed-programs\/bulk-delete\/?$/),
      { timeout: 60_000 }
    )
    await guide.getByRole('button', { name: '삭제' }).click()
    const deleteResponse = await deletePromise
    if (!deleteResponse.ok() && deleteResponse.status() !== 409) {
      const body = await deleteResponse.text().catch(() => '')
      throw new Error(
        `세부 프로그램 삭제 API 실패: HTTP ${deleteResponse.status()} ${body.slice(0, 400)}`
      )
    }
    return deleteResponse
  }

  async expectDeleteBlocked() {
    const blocked = this.page.getByRole('dialog').filter({ hasText: '세부 프로그램 삭제 불가 안내' })
    await expect(blocked).toBeVisible({ timeout: 15_000 })
    await blocked.getByRole('button', { name: '확인' }).click()
    await expect(blocked).toBeHidden({ timeout: 10_000 })
  }

  async tryDeleteInUseSeed(name: string): Promise<'blocked' | 'missing' | 'deleted'> {
    const found = await this.tryFind(name)
    if (!found) {
      await this.fillName(name)
      await this.search()
      if (!(await this.tryFind(name, 5_000))) return 'missing'
    }
    const response = await this.deleteFromListTyped(name)
    if (response.status() === 409) {
      await this.expectDeleteBlocked()
      return 'blocked'
    }
    return 'deleted'
  }
}
