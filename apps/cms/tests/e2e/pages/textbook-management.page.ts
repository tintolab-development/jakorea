/**
 * 교재 관리 POM — `/textbook`
 *
 * 기본 필터 `tb_use=USED`. 사업 분야 관리 버튼은 FE에 없다.
 */

import { type Locator, type Page, expect } from '@playwright/test'
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
import { detailInfoField, fillByPlaceholder, selectByPlaceholder } from './form-helpers'

const LIST_COLUMNS = [
  'No.',
  '사용 여부',
  '교재명',
  '사업 분야',
  '교육 대상',
  '대상 학년',
  '등록자',
  '등록일시',
] as const

export class TextbookManagementPage {
  readonly uniqueName: string

  constructor(private readonly page: Page) {
    this.uniqueName = `${DATA_MANAGEMENT_NAME_PREFIX}-교재-${Date.now()}`
  }

  async gotoList() {
    await this.page.goto('/textbook')
  }

  async expectListShell() {
    await expectAuthenticatedShell(this.page)
    await expect(this.page.getByRole('menuitem', { name: '교재 관리' })).toBeVisible()
    await expect(this.page.getByText('교재 목록').first()).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: '교재 삭제' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '키트 수량 관리' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '사업 분야 관리' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '교재 등록' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '엑셀 다운로드' })).toBeVisible()
  }

  async expectListColumns() {
    await expectColumnTitles(this.page, LIST_COLUMNS)
  }

  async expectBusinessAreaManageButton() {
    await expect(this.page.getByRole('button', { name: '사업 분야 관리' })).toBeVisible()
  }

  async openBusinessAreaModal() {
    const pending = waitForAdminGet(this.page, '/api/admin/textbook-business-areas')
    await this.page.getByRole('button', { name: '사업 분야 관리' }).click()
    await pending
    const modal = this.businessAreaModal()
    await expect(modal).toBeVisible({ timeout: 15_000 })
    return modal
  }

  businessAreaModal(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: '사업 분야 관리' })
  }

  async registerAndDeleteUniqueBusinessArea() {
    const name = `${DATA_MANAGEMENT_NAME_PREFIX}-분야-${Date.now()}`
    const modal = await this.openBusinessAreaModal()
    await modal.getByRole('button', { name: '사업 분야 추가' }).click()
    const nameInput = modal.getByLabel('새 사업 분야명')
    await expect(nameInput).toBeVisible()
    await nameInput.fill(name)

    const createPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/textbook-business-areas\/?$/),
      { timeout: 60_000 }
    )
    await nameInput.press('Enter')
    const created = await createPromise
    if (!created.ok()) {
      const body = await created.text().catch(() => '')
      throw new Error(`사업 분야 등록 API 실패: HTTP ${created.status()} ${body.slice(0, 400)}`)
    }
    const row = modal.locator('tr.ant-table-row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    const blocked = this.page.getByRole('dialog').filter({ hasText: '사업 분야 삭제 불가' })
    const deletePromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'DELETE', /\/api\/admin\/textbook-business-areas\/[^/]+\/?$/),
      { timeout: 20_000 }
    )
    await row.getByRole('button', { name: '삭제' }).click()
    const outcome = await Promise.race([
      deletePromise.then(res => ({ kind: 'deleted' as const, res })),
      blocked.waitFor({ state: 'visible', timeout: 20_000 }).then(() => ({ kind: 'blocked' as const })),
    ])
    if (outcome.kind === 'blocked') {
      await blocked.getByRole('button', { name: '확인' }).click()
      throw new Error(`사업 분야 삭제가 클라이언트에서 차단되었습니다: ${name}`)
    }
    const deleted = outcome.res
    if (deleted.status() === 409) {
      const blocked = this.page.getByRole('dialog').filter({ hasText: /삭제 불가/ })
      if (await blocked.isVisible().catch(() => false)) {
        await blocked.getByRole('button', { name: '확인' }).click()
      }
      throw new Error(`사업 분야 삭제 409 — 시드/참조 행이 아니어야 합니다: ${name}`)
    }
    if (!deleted.ok()) {
      const body = await deleted.text().catch(() => '')
      throw new Error(`사업 분야 삭제 API 실패: HTTP ${deleted.status()} ${body.slice(0, 400)}`)
    }
    await expect(modal.locator('tr.ant-table-row').filter({ hasText: name })).toHaveCount(0, {
      timeout: 15_000,
    })
    await modal.getByRole('button', { name: '닫기' }).click()
    await expect(modal).toBeHidden({ timeout: 10_000 })
  }

  async expectDefaultUseUsed() {
    await expect(this.page).toHaveURL(/tb_use=USED/, { timeout: 15_000 })
    await expect(
      filterField(this.page, '사용 여부').getByRole('radio', { name: '사용' })
    ).toBeChecked()
  }

  async selectUseStatus(label: '사용' | '미사용') {
    await filterField(this.page, '사용 여부').getByRole('radio', { name: label }).check({ force: true })
  }

  async fillTextbookName(name: string) {
    await this.page.getByPlaceholder('교재명').fill(name)
  }

  async selectEducationTarget(label: string) {
    const field = filterField(this.page, '교육 대상')
    await field.locator('.ant-select').click()
    const dropdown = this.page.locator('.ant-select-dropdown:visible').last()
    await dropdown.getByText(label, { exact: true }).click()
  }

  async expectGradeOptions(labels: readonly string[]) {
    const field = filterField(this.page, '대상 학년')
    await field.locator('.ant-select').click()
    const dropdown = this.page.locator('.ant-select-dropdown:visible').last()
    await expect(dropdown).toBeVisible({ timeout: 10_000 })
    for (const label of labels) {
      await expect(dropdown.getByText(label, { exact: true }).first()).toBeVisible()
    }
    await field.locator('.ant-select').click({ force: true }).catch(() => undefined)
    await expect(this.page.locator('.ant-select-dropdown:visible'))
      .toHaveCount(0, { timeout: 5_000 })
      .catch(() => undefined)
  }

  async search() {
    const pending = waitForAdminGet(this.page, '/api/admin/textbooks')
    await clickSearch(this.page)
    await pending
  }

  dataRows() {
    return tableRows(this.page)
  }

  async tryFind(name: string, timeoutMs = 8_000) {
    return tryFindRow(this.page, name, timeoutMs)
  }

  async searchAndOpen(name: string): Promise<boolean> {
    await this.fillTextbookName(name)
    await this.search()
    const found = await this.tryFind(name)
    if (!found) return false
    await this.dataRows().filter({ hasText: name }).first().click()
    try {
      await expect(this.page).toHaveURL(/textbookId=/, { timeout: 15_000 })
      await expect(this.detailDialog()).toBeVisible({ timeout: 15_000 })
      return true
    } catch {
      return false
    }
  }

  detailDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: '교재 정보' }).first()
  }

  async expectDetailFields() {
    const dialog = this.detailDialog()
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByText('교재명 (국문)', { exact: false }).or(dialog.getByText('교재명')).first()).toBeVisible()
    await expect(dialog.getByText('교재명 (영문)').first()).toBeVisible()
    await expect(dialog.getByText('교육 분야').first()).toBeVisible()
    await expect(dialog.getByText('사용 여부').first()).toBeVisible()
    await expect(dialog.getByText('유아').first()).toBeVisible()
    await expect(dialog.getByText('초등학교').first()).toBeVisible()
    await expect(dialog.getByText('중학교').first()).toBeVisible()
    await expect(dialog.getByText('고등학교').first()).toBeVisible()
    await expect(dialog.getByText('대학교').first()).toBeVisible()
    await expect(dialog.getByRole('button', { name: '정보 수정' })).toBeVisible()
  }

  async closeDetail() {
    const dialog = this.detailDialog()
    if (!(await dialog.isVisible().catch(() => false))) return
    await dialog.getByRole('button', { name: '닫기' }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  }

  async selectRegisterBusinessArea() {
    try {
      await selectByPlaceholder(this.page, '사업 분야를 선택해 주세요.', '경제금융')
      return
    } catch {
      // 마스터 API 시드명이 다르면 첫 옵션
    }
    await selectByPlaceholder(this.page, '사업 분야를 선택해 주세요.')
  }

  async registerTextbook() {
    await this.page.getByRole('button', { name: '교재 등록' }).click()
    const modal = this.page.getByRole('dialog').filter({ hasText: '교재 등록' })
    await expect(modal).toBeVisible()
    await modal.getByRole('radio', { name: '사용' }).check({ force: true })
    await fillByPlaceholder(modal, '교재명을 입력해 주세요.', this.uniqueName)
    await this.selectRegisterBusinessArea()
    await selectByPlaceholder(this.page, '교육 대상을 선택해 주세요.', '초등학교')
    await selectByPlaceholder(this.page, '대상 학년을 선택해 주세요.', '전학년')

    const createPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/textbooks\/?$/),
      { timeout: 60_000 }
    )
    await modal.getByRole('button', { name: '등록' }).click()
    const createResponse = await createPromise
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(`교재 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`)
    }
    await expect(modal).toBeHidden({ timeout: 15_000 })
  }

  async expectInList(name: string) {
    await this.fillTextbookName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name }).first()).toBeVisible({ timeout: 30_000 })
  }

  async expectNotInList(name: string) {
    await this.fillTextbookName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name })).toHaveCount(0, { timeout: 30_000 })
  }

  async updateUniqueTextbookEnglishName() {
    const opened = await this.searchAndOpen(this.uniqueName)
    if (!opened) throw new Error(`교재 상세를 열 수 없습니다: ${this.uniqueName}`)
    const dialog = this.detailDialog()
    await dialog.getByRole('button', { name: '정보 수정' }).click()
    const enInput = detailInfoField(this.page, '교재명 (영문)').locator('input')
    await expect(enInput).toBeVisible({ timeout: 10_000 })
    await enInput.fill(`${this.uniqueName} EN`)

    const patchPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'PATCH', /\/api\/admin\/textbooks\/[^/]+\/?$/),
      { timeout: 60_000 }
    )
    await dialog.getByRole('button', { name: '저장' }).click()
    const patch = await patchPromise
    if (!patch.ok()) {
      const body = await patch.text().catch(() => '')
      throw new Error(`교재 수정 API 실패: HTTP ${patch.status()} ${body.slice(0, 400)}`)
    }
    await expect(dialog.getByRole('button', { name: '정보 수정' })).toBeVisible({ timeout: 15_000 })
    await this.closeDetail()
  }

  async deleteFromListTyped(name: string) {
    await this.fillTextbookName(name)
    await this.search()
    await selectRowCheckbox(this.page, name)
    await this.page.getByRole('button', { name: '교재 삭제' }).click()
    const guide = this.page.getByRole('dialog').filter({ hasText: /교재 삭제/ })
    await expect(guide).toBeVisible()
    await fillTypedDeleteConfirm(guide)

    const deletePromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/textbooks\/bulk-delete\/?$/),
      { timeout: 60_000 }
    )
    await guide.getByRole('button', { name: '삭제' }).click()
    const deleteResponse = await deletePromise
    if (!deleteResponse.ok()) {
      const body = await deleteResponse.text().catch(() => '')
      throw new Error(`교재 삭제 API 실패: HTTP ${deleteResponse.status()} ${body.slice(0, 400)}`)
    }
    await expect(guide).toBeHidden({ timeout: 15_000 })
  }

  async openKitModal() {
    const pending = waitForAdminGet(this.page, '/api/admin/material-kits', 10_000)
    await this.page.getByRole('button', { name: '키트 수량 관리' }).click()
    await pending
    const modal = this.kitModal()
    await expect(modal).toBeVisible({ timeout: 15_000 })
    await expect(modal.getByText('유아')).toBeVisible()
    await expect(modal.getByText('초등')).toBeVisible()
    await expect(modal.getByText('중등')).toBeVisible()
    await expect(modal.getByText('고등')).toBeVisible()
    await expect(modal.getByText('대학')).toBeVisible()
  }

  kitModal(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: '키트 수량 관리' })
  }

  async readKitQuantity(level: '유아' | '초등' | '중등' | '고등' | '대학') {
    return this.kitModal().getByLabel(`${level} 키트 수량`).inputValue()
  }

  async setKitQuantity(level: '유아' | '초등' | '중등' | '고등' | '대학', value: string) {
    await this.kitModal().getByLabel(`${level} 키트 수량`).fill(value)
  }

  async confirmKitModal() {
    await this.kitModal().getByRole('button', { name: '확인' }).click()
  }

  async expectKitChangeNotice() {
    const notice = this.page.getByRole('dialog').filter({ hasText: '키트수량 변경' })
    await expect(notice).toBeVisible({ timeout: 10_000 })
    await expect(notice.getByText(/기존에 진행된 프로그램에는 반영되지 않/)).toBeVisible()
    await expect(notice.getByText(/신규로 진행되는 프로그램부터 적용/)).toBeVisible()
    return notice
  }

  async saveKitChangeNotice(notice: Locator) {
    const patchPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/material-kits\/versions\/[^/]+\/target-counts\/?$/),
      { timeout: 60_000 }
    )
    await notice.getByRole('button', { name: '확인' }).click()
    const res = await patchPromise
    if (!res.ok()) {
      const body = await res.text().catch(() => '')
      throw new Error(`키트 수량 저장 API 실패: HTTP ${res.status()} ${body.slice(0, 400)}`)
    }
    await expect(notice).toBeHidden({ timeout: 15_000 })
  }

  async cancelKitChangeNotice(notice: Locator) {
    await notice.getByRole('button', { name: '취소' }).click()
    await expect(notice).toBeHidden({ timeout: 10_000 })
  }
}
