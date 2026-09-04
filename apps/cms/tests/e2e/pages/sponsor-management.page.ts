/**
 * 후원사 관리 POM — `/sponsor`
 *
 * 기본 목록 필터는 기업(`sp_kind=corporate`). 재단 시드(제이에이코리아)는 구분=재단 조회 후 연다.
 */

import { type Locator, type Page, expect } from '@playwright/test'
import { expectAuthenticatedShell } from '../helpers/authenticated-shell'
import {
  clickSearch,
  DELETE_TYPED_PLACEHOLDER,
  dismissVisibleDialog,
  expectColumnTitles,
  expectNoColumnTitle,
  fillTypedDeleteConfirm,
  filterField,
  isAdminMutation,
  selectRowCheckbox,
  tableRows,
  tryFindRow,
  waitForAdminGet,
} from './data-management-helpers'
import { DATA_MANAGEMENT_NAME_PREFIX } from './data-management-seed-titles'
import { fillByPlaceholder, selectByPlaceholder } from './form-helpers'

const LIST_COLUMNS = [
  'No.',
  '구분',
  '후원사명',
  '프로그램 진행 수',
  '누적 후원금',
  '누적 수혜자',
  '후원 상태',
  '주 담당자',
  '후원 시작일',
] as const

const CONTACT_COLUMNS = [
  '담당자 유형',
  '부서',
  '직함',
  '담당자명',
  '내선번호',
  '연락처',
  '이메일',
  '회사 주소',
  '비고',
  '등록일시',
] as const

const HISTORY_COLUMNS = [
  '프로그램명',
  '진행년도',
  '프로그램 진행 현황',
  '참여자 유형',
  '교육 대상',
  '후원사 담당자명',
] as const

export class SponsorManagementPage {
  readonly uniqueName: string
  readonly uniqueNameUpdated: string
  readonly uniqueContactName: string
  readonly uniqueContactAssistantName: string
  readonly uniqueBusinessNumber: string

  constructor(private readonly page: Page) {
    const stamp = Date.now()
    this.uniqueName = `${DATA_MANAGEMENT_NAME_PREFIX}-후원사-${stamp}`
    this.uniqueNameUpdated = `${DATA_MANAGEMENT_NAME_PREFIX}-후원사-수정-${stamp}`
    this.uniqueContactName = `${DATA_MANAGEMENT_NAME_PREFIX}-담당-${stamp}`
    this.uniqueContactAssistantName = `${DATA_MANAGEMENT_NAME_PREFIX}-부담당-${stamp}`
    const tail = String(stamp).slice(-5).padStart(5, '0')
    this.uniqueBusinessNumber = `123-45-${tail}`
  }

  async gotoList() {
    await this.page.goto('/sponsor')
  }

  async expectListShell() {
    await expectAuthenticatedShell(this.page)
    await expect(this.page.getByRole('menuitem', { name: '후원사 관리' })).toBeVisible()
    await expect(this.page.getByText('후원사 목록').first()).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: '후원사 삭제' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '후원사 등록' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '엑셀 다운로드' })).toBeVisible()
  }

  async expectListColumns() {
    await expectColumnTitles(this.page, LIST_COLUMNS)
    await expectNoColumnTitle(this.page, '주 담당자 연락처')
  }

  async expectDefaultKindCorporate() {
    await expect(this.page).toHaveURL(/sp_kind=corporate/, { timeout: 15_000 })
    await expect(
      filterField(this.page, '구분').getByRole('radio', { name: '기업' })
    ).toBeChecked()
  }

  async selectKind(kind: '기업' | '재단') {
    await filterField(this.page, '구분').getByRole('radio', { name: kind }).check({ force: true })
  }

  async fillListName(name: string) {
    await this.page.getByPlaceholder('후원사명을 입력하세요').fill(name)
  }

  async fillManagerName(name: string) {
    await this.page.getByPlaceholder('담당자명을 입력하세요').fill(name)
  }

  async selectSponsorshipStatus(label: string) {
    await selectByPlaceholder(this.page, '전체', label)
  }

  async expectDateRangeFilter() {
    await expect(filterField(this.page, '후원 시작일')).toBeVisible()
  }

  async search() {
    const pending = waitForAdminGet(this.page, '/api/admin/sponsors')
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
    await this.fillListName(name)
    await this.search()
    const found = await this.tryFind(name)
    if (!found) return false
    await this.dataRows().filter({ hasText: name }).first().click()
    try {
      await expect(this.page).toHaveURL(/sponsorId=/, { timeout: 15_000 })
      await expect(this.detailDialog()).toBeVisible({ timeout: 15_000 })
      return true
    } catch {
      return false
    }
  }

  detailDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: '후원사 상세 정보' }).first()
  }

  async expectDetailOpen() {
    await expect(this.detailDialog()).toBeVisible({ timeout: 30_000 })
    await expect(this.page).toHaveURL(/sponsorLnb=sponsor-detail/)
  }

  async closeDetail() {
    const dialog = this.detailDialog()
    if (!(await dialog.isVisible().catch(() => false))) return
    await dialog.getByRole('button', { name: '닫기' }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  }

  async clickLnb(label: '후원사 상세 정보' | '프로그램 진행 이력' | '후원사 담당자 정보') {
    const dialog = this.detailDialog()
    if (label === '프로그램 진행 이력') {
      const pending = waitForAdminGet(this.page, '/program-histories', 30_000, { exact: false })
      await dialog.getByRole('button', { name: label }).click()
      await pending
      return
    }
    if (label === '후원사 담당자 정보') {
      const pending = waitForAdminGet(this.page, '/contacts', 30_000, { exact: false })
      await dialog.getByRole('button', { name: label }).click()
      await pending
      return
    }
    await dialog.getByRole('button', { name: label }).click()
  }

  async expectLnbUrl(lnb: 'sponsor-detail' | 'sponsor-programs' | 'sponsor-contacts') {
    await expect(this.page).toHaveURL(new RegExp(`sponsorLnb=${lnb}`), { timeout: 10_000 })
  }

  async expectBasicInfoFields() {
    const dialog = this.detailDialog()
    await expect(dialog.getByText('기본 정보').first()).toBeVisible()
    await expect(dialog.getByText('후원사명').first()).toBeVisible()
    await expect(dialog.getByText('사업자').first()).toBeVisible()
    await expect(dialog.getByText('후원 시작일').first()).toBeVisible()
    await expect(dialog.getByText('대표이사').first()).toBeVisible()
    await expect(dialog.getByText(/소재지|후원사 소재지/).first()).toBeVisible()
  }

  async expectHomepageFieldAndLogoBulk() {
    const dialog = this.detailDialog()
    await expect(dialog.getByText('홈페이지', { exact: true }).first()).toBeVisible()
    await expect(dialog.getByRole('button', { name: '로고 일괄 다운로드' })).toBeVisible()
  }

  async expectYearlyPanel(opts?: { donation?: string; beneficiary?: string }) {
    const dialog = this.detailDialog()
    await expect(dialog.getByText('연도별 후원금').first()).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText(/누적 후원금/).first()).toBeVisible()
    await expect(dialog.getByText(/누적 수혜자/).first()).toBeVisible()
    if (opts?.donation) {
      await expect(dialog.getByText(new RegExp(opts.donation)).first()).toBeVisible({
        timeout: 10_000,
      })
    }
    if (opts?.beneficiary) {
      await expect(dialog.getByText(new RegExp(opts.beneficiary)).first()).toBeVisible()
    }
  }

  async expectHistoryShell() {
    const dialog = this.detailDialog()
    await expect(dialog.getByText('프로그램 진행 이력').first()).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByPlaceholder('프로그램명을 입력하세요')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '이력 삭제' })).toBeDisabled()
    await expectColumnTitles(this.page, HISTORY_COLUMNS, dialog)
    await expectNoColumnTitle(this.page, '참여자 모집 인원', dialog)
  }

  /** 이력 행 클릭 → 프로그램 상세 URL. programId FK가 없으면 그대로 둔다. */
  async tryOpenHistoryProgramDetail(): Promise<'navigated' | 'no-fk' | 'empty'> {
    const row = tableRows(this.page).first()
    if (!(await row.isVisible().catch(() => false))) return 'empty'
    const urlBefore = this.page.url()
    await row.click()
    try {
      await expect(this.page).toHaveURL(/programId=/, { timeout: 8_000 })
      return 'navigated'
    } catch {
      if (this.page.url() === urlBefore) return 'no-fk'
      return this.page.url().includes('programId=') ? 'navigated' : 'no-fk'
    }
  }

  async expectContactsShell() {
    const dialog = this.detailDialog()
    await expect(dialog.getByText('담당자 목록').first()).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByPlaceholder('부서를 입력하세요')).toBeVisible()
    await expect(dialog.getByPlaceholder('직함을 입력하세요')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '담당자 등록' })).toBeVisible()
    await expectColumnTitles(this.page, CONTACT_COLUMNS, dialog)
  }

  async searchContacts(opts: { department?: string; position?: string; name?: string }) {
    const dialog = this.detailDialog()
    await dialog.getByPlaceholder('부서를 입력하세요').fill(opts.department ?? '')
    await dialog.getByPlaceholder('직함을 입력하세요').fill(opts.position ?? '')
    await dialog.getByPlaceholder('담당자명을 입력하세요').fill(opts.name ?? '')
    const pending = waitForAdminGet(this.page, '/contacts', 30_000, { exact: false })
    await dialog.getByRole('button', { name: '조회' }).click()
    await pending
  }

  async openLeadTypeDropdown() {
    const leadRow = tableRows(this.page)
      .filter({ hasText: '주 담당자' })
      .first()
    await expect(leadRow).toBeVisible({ timeout: 10_000 })
    await leadRow.locator('.status-dropdown-cell__status-trigger, .editable-status-badge').first().click()
  }

  async registerSponsor() {
    await this.page.getByRole('button', { name: '후원사 등록' }).click()
    const modal = this.page.getByRole('dialog').filter({ hasText: '후원사 신규 등록' })
    await expect(modal).toBeVisible()
    await modal.getByPlaceholder('후원사명').first().fill(this.uniqueName)
    await modal.getByPlaceholder('후원사명').nth(1).fill(`Tintolab ${this.uniqueName}`)
    await modal.getByRole('radio', { name: '기업' }).check({ force: true })
    await modal.getByPlaceholder('000-00-00000').fill(this.uniqueBusinessNumber)
    await fillByPlaceholder(modal, '대표이사', '틴토랩대표')

    const createPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/sponsors\/?$/),
      { timeout: 60_000 }
    )
    await modal.getByRole('button', { name: '신규 등록' }).click()
    const createResponse = await createPromise
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(`후원사 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`)
    }

    const done = this.page.getByRole('dialog').filter({ hasText: '후원사 등록 완료' })
    await expect(done).toBeVisible({ timeout: 15_000 })
    await done.getByRole('button', { name: '확인' }).click()
    await expect(done).toBeHidden({ timeout: 10_000 })
  }

  async expectInList(name: string) {
    await this.fillListName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name }).first()).toBeVisible({ timeout: 30_000 })
  }

  async expectNotInList(name: string) {
    await this.fillListName(name)
    await this.search()
    await expect(this.dataRows().filter({ hasText: name })).toHaveCount(0, { timeout: 30_000 })
  }

  async openUniqueDetail() {
    const opened = await this.searchAndOpen(this.uniqueName)
    if (!opened) throw new Error(`후원사 상세를 열 수 없습니다: ${this.uniqueName}`)
    await this.expectDetailOpen()
  }

  async updateUniqueName() {
    const dialog = this.detailDialog()
    await dialog.getByRole('button', { name: '정보 수정' }).click()
    const koInput = dialog.getByPlaceholder('후원사명(한글)')
    await expect(koInput).toBeVisible({ timeout: 10_000 })
    await koInput.fill(this.uniqueNameUpdated)

    const patchPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'PATCH', /\/api\/admin\/sponsors\/[^/]+\/?$/),
      { timeout: 60_000 }
    )
    await dialog.getByRole('button', { name: '수정 완료' }).click()
    const patch = await patchPromise
    if (!patch.ok()) {
      const body = await patch.text().catch(() => '')
      throw new Error(`후원사 수정 API 실패: HTTP ${patch.status()} ${body.slice(0, 400)}`)
    }
    await expect(dialog.getByRole('button', { name: '정보 수정' })).toBeVisible({ timeout: 15_000 })
  }

  async changeListStatus(name: string, nextLabel: '후원 중' | '후원 종료') {
    await this.fillListName(name)
    await this.search()
    const row = this.dataRows().filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.locator('.status-dropdown-cell__status-trigger, .editable-status-badge').first().click()
    const option = this.page.getByRole('menuitem', { name: nextLabel }).or(
      this.page.locator('.ant-dropdown-menu-item, .status-dropdown-cell__dropdown').getByText(nextLabel, {
        exact: true,
      })
    )
    const statusPromise = this.page.waitForResponse(
      res =>
        isAdminMutation(res, 'PATCH', /\/api\/admin\/sponsors\/[^/]+\/?$/) ||
        isAdminMutation(res, 'POST', /\/api\/admin\/sponsors\/[^/]+\/end\/?$/),
      { timeout: 60_000 }
    )
    await option.first().click()
    const statusRes = await statusPromise
    if (!statusRes.ok()) {
      const body = await statusRes.text().catch(() => '')
      throw new Error(`후원 상태 변경 API 실패: HTTP ${statusRes.status()} ${body.slice(0, 400)}`)
    }
    await expect(row.getByText(nextLabel).first()).toBeVisible({ timeout: 15_000 })
  }

  async deleteFromDetailTyped() {
    const dialog = this.detailDialog()
    await dialog.getByRole('button', { name: '후원사 삭제' }).click()
    const guide = this.page.getByRole('dialog').filter({ hasText: '후원사 삭제' }).last()
    await expect(guide).toBeVisible()
    const confirmBtn = guide.getByRole('button', { name: '후원사 삭제' })
    await expect(confirmBtn).toBeDisabled()
    await fillTypedDeleteConfirm(guide)
    await expect(confirmBtn).toBeEnabled()

    const deletePromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'DELETE', /\/api\/admin\/sponsors\/[^/]+\/?$/),
      { timeout: 60_000 }
    )
    await confirmBtn.click()
    const deleteResponse = await deletePromise
    if (!deleteResponse.ok()) {
      const body = await deleteResponse.text().catch(() => '')
      throw new Error(`후원사 삭제 API 실패: HTTP ${deleteResponse.status()} ${body.slice(0, 400)}`)
    }
    await dismissVisibleDialog(this.page, /후원사 삭제 완료/)
  }

  async expectListDeleteHasNoTypedConfirm() {
    const guide = this.page.getByRole('dialog').filter({ hasText: '후원사 삭제 안내' })
    await expect(guide).toBeVisible({ timeout: 10_000 })
    await expect(guide.getByPlaceholder(DELETE_TYPED_PLACEHOLDER)).toHaveCount(0)
  }

  async openListDeleteForRow(name: string) {
    await this.fillListName(name)
    await this.search()
    await selectRowCheckbox(this.page, name)
    await this.page.getByRole('button', { name: '후원사 삭제' }).click()
  }

  async confirmListDeleteWithoutTyping() {
    const guide = this.page.getByRole('dialog').filter({ hasText: /후원사 삭제/ }).last()
    await guide.getByRole('button', { name: '후원사 삭제' }).click()
  }

  async expectDeleteBlocked() {
    const blocked = this.page.getByRole('dialog').filter({ hasText: '후원사 삭제 불가' })
    await expect(blocked).toBeVisible({ timeout: 15_000 })
    await blocked.getByRole('button', { name: '확인' }).click()
    await expect(blocked).toBeHidden({ timeout: 10_000 })
  }

  async registerContact(opts: {
    type: 'lead' | 'assistant'
    name: string
    email: string
    phone: string
  }) {
    const dialog = this.detailDialog()
    await dialog.getByRole('button', { name: '담당자 등록' }).click()
    const modal = this.page.getByRole('dialog').filter({ hasText: '담당자 등록' })
    await expect(modal).toBeVisible()
    const typeLabel = opts.type === 'lead' ? '주 담당자' : '담당자'
    await modal.getByRole('radio', { name: typeLabel, exact: true }).check({ force: true })
    await modal.getByPlaceholder('담당자명을 입력해 주세요').fill(opts.name)
    await modal.getByPlaceholder('부서를 입력해 주세요').fill('E2E팀')
    await modal.getByPlaceholder('직함을 입력해 주세요').fill('사원')
    await modal.getByPlaceholder('내선번호를 입력해 주세요').fill('1234')
    await modal.getByPlaceholder('연락처를 입력해 주세요').fill(opts.phone)
    await modal.getByPlaceholder('이메일을 입력해 주세요').fill(opts.email)
    await modal.getByPlaceholder('회사 주소를 입력해 주세요').fill('서울시 강남구')
    await modal.getByPlaceholder('비고를 입력해 주세요').fill('E2E')

    const postPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/sponsors\/[^/]+\/contacts\/?$/),
      { timeout: 60_000 }
    )
    await modal.getByRole('button', { name: '등록' }).click()
    const post = await postPromise
    if (!post.ok()) {
      const body = await post.text().catch(() => '')
      throw new Error(`담당자 등록 API 실패: HTTP ${post.status()} ${body.slice(0, 400)}`)
    }
    await expect(modal).toBeHidden({ timeout: 15_000 })
    const done = this.page.getByRole('dialog').filter({ hasText: '담당자 등록 완료' })
    if (await done.isVisible().catch(() => false)) {
      await done.getByRole('button', { name: '확인' }).click()
      await expect(done).toBeHidden({ timeout: 10_000 })
    }
    await expect(tableRows(this.page).filter({ hasText: opts.name }).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  async promoteContactToLead(name: string) {
    const row = tableRows(this.page).filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.locator('.status-dropdown-cell__status-trigger, .editable-status-badge').first().click()
    const option = this.page.getByRole('menuitem', { name: '주 담당자' }).or(
      this.page.locator('.ant-dropdown-menu-item, .status-dropdown-cell__dropdown').getByText(
        '주 담당자',
        { exact: true }
      )
    )
    const patchPromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'PATCH', /\/api\/admin\/sponsors\/contacts\/[^/]+\/?$/),
      { timeout: 60_000 }
    )
    await option.first().click()
    const patch = await patchPromise
    if (!patch.ok()) {
      const body = await patch.text().catch(() => '')
      throw new Error(`담당자 유형 변경 API 실패: HTTP ${patch.status()} ${body.slice(0, 400)}`)
    }
    await expect(row.getByText('주 담당자', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  }

  async deleteContact(name: string) {
    await selectRowCheckbox(this.page, name)
    await this.detailDialog().getByRole('button', { name: '담당자 삭제' }).click()
    const guide = this.page.getByRole('dialog').filter({ hasText: '후원사 담당자 삭제' }).last()
    await expect(guide).toBeVisible()
    const deletePromise = this.page.waitForResponse(
      res => isAdminMutation(res, 'POST', /\/api\/admin\/sponsors\/contacts\/bulk-delete\/?$/),
      { timeout: 60_000 }
    )
    await guide.getByRole('button', { name: '담당자 삭제' }).click()
    const deleteResponse = await deletePromise
    if (!deleteResponse.ok()) {
      const body = await deleteResponse.text().catch(() => '')
      throw new Error(`담당자 삭제 API 실패: HTTP ${deleteResponse.status()} ${body.slice(0, 400)}`)
    }
    await expect(tableRows(this.page).filter({ hasText: name })).toHaveCount(0, { timeout: 15_000 })
  }
}
