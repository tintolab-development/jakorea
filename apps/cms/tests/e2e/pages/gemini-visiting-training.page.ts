/**
 * Gemini 찾아가는 연수 — 목록 탭 · 모집/승인 상세 POM (Phase 5)
 *
 * 일반·1사1교·UJAT 상세 POM과 분리. URL 키: recruitmentId / approvedTrainingId.
 */

import { type Page, expect } from '@playwright/test'
import {
  GEMINI_APPROVED_INSTITUTION_CANDIDATES,
  GEMINI_VISITING_FEATURED_CANDIDATES,
} from './gemini-seed-titles'

export type GeminiRecruitmentOpenResult = {
  recruitmentId: string
  title: string
}

export type GeminiApprovedOpenResult = {
  approvedTrainingId: string
  institutionName: string
}

export type GeminiRecruitmentLnbKey = 'info' | 'institutions' | 'managers'
export type GeminiApprovedLnbKey = 'info' | 'instructors' | 'managers'

const LIST_PATH = '/programs/gemini/visiting-training'

export class GeminiVisitingTrainingPage {
  constructor(private readonly page: Page) {}

  recruitmentNav() {
    return this.page.getByRole('navigation', { name: '찾아가는 연수 상세 메뉴' })
  }

  approvedNav() {
    return this.page.getByRole('navigation', { name: '승인 연수 상세 메뉴' })
  }

  async gotoList(tab: 'recruitment' | 'approved' = 'recruitment') {
    const url =
      tab === 'approved' ? `${LIST_PATH}?tab=approved` : LIST_PATH
    await this.page.goto(url)
  }

  async expectListShell(tab: 'recruitment' | 'approved' = 'recruitment') {
    if (tab === 'recruitment') {
      await expect(this.page.getByRole('button', { name: '모집 공고 추가' })).toBeVisible({
        timeout: 30_000,
      })
    } else {
      await expect(this.page.getByText(/승인 연수|기관명|강사/).first()).toBeVisible({
        timeout: 30_000,
      })
    }
    await this.expectTableOrEmpty()
    // 로딩 스피너가 사라진 뒤 행 카운트
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined)
  }

  async selectListTab(tab: 'recruitment' | 'approved') {
    const label = tab === 'recruitment' ? '모집 공고' : '승인 연수'
    await this.page.getByRole('tab', { name: label }).click()
    if (tab === 'approved') {
      await expect(this.page).toHaveURL(/tab=approved/, { timeout: 15_000 })
    } else {
      await expect(this.page).not.toHaveURL(/tab=approved/, { timeout: 15_000 })
    }
    await this.expectListShell(tab)
  }

  async expectTableOrEmpty() {
    const table = this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()
    const empty = this.page.locator('.ant-empty, .ant-table-placeholder').first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
  }

  async tryExpectRecruitmentShellReady(timeoutMs = 60_000): Promise<boolean> {
    try {
      await expect(this.recruitmentNav()).toBeVisible({ timeout: timeoutMs })
      return true
    } catch {
      return false
    }
  }

  async tryExpectApprovedShellReady(timeoutMs = 60_000): Promise<boolean> {
    try {
      await expect(this.approvedNav()).toBeVisible({ timeout: timeoutMs })
      return true
    } catch {
      return false
    }
  }

  async isRecruitmentDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText(/모집 공고 정보를 찾을 수 없습니다|불러오지 못했습니다/)
      .first()
      .isVisible()
      .catch(() => false)
  }

  async isApprovedDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText(/승인 연수 정보를 찾을 수 없습니다|불러오지 못했습니다/)
      .first()
      .isVisible()
      .catch(() => false)
  }

  private dataRows() {
    return this.page.locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
  }

  /**
   * 임시저장(draft) 행은 클릭 시 등록 모달로 가므로 제외.
   */
  private nonDraftDataRows() {
    return this.dataRows().filter({ hasNotText: '임시저장' })
  }

  async tryOpenRecruitmentByTitleOnce(
    title: string
  ): Promise<GeminiRecruitmentOpenResult | null> {
    await this.gotoList('recruitment')
    await this.expectListShell('recruitment')

    const row = this.nonDraftDataRows().filter({ hasText: title }).first()

    try {
      await expect(row).toBeVisible({ timeout: 8_000 })
    } catch {
      return null
    }

    await row.click()
    try {
      await expect(this.page).toHaveURL(/recruitmentId=/, { timeout: 20_000 })
    } catch {
      await this.closeDetail()
      // draft 등 → 등록 모달로 빠지면 닫고 실패 처리
      if (this.page.url().includes('recruitmentAdd=')) {
        await this.page.goto(LIST_PATH)
      }
      return null
    }

    const recruitmentId = new URL(this.page.url()).searchParams.get('recruitmentId')
    if (!recruitmentId) return null

    const shellOk = await this.tryExpectRecruitmentShellReady(20_000)
    if (!shellOk || (await this.isRecruitmentDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { recruitmentId, title }
  }

  async tryOpenFirstRecruitmentRow(): Promise<GeminiRecruitmentOpenResult | null> {
    await this.gotoList('recruitment')
    await this.expectListShell('recruitment')

    const row = this.nonDraftDataRows().first()
    try {
      await expect(row).toBeVisible({ timeout: 10_000 })
    } catch {
      return null
    }

    const title =
      ((await row.innerText().catch(() => '')) ?? '').split('\n')[0]?.trim() ?? ''
    await row.click()
    try {
      await expect(this.page).toHaveURL(/recruitmentId=/, { timeout: 20_000 })
    } catch {
      if (this.page.url().includes('recruitmentAdd=')) {
        await this.page.goto(LIST_PATH)
      }
      return null
    }

    const recruitmentId = new URL(this.page.url()).searchParams.get('recruitmentId')
    if (!recruitmentId) return null

    const shellOk = await this.tryExpectRecruitmentShellReady(20_000)
    if (!shellOk || (await this.isRecruitmentDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { recruitmentId, title: title || recruitmentId }
  }

  async tryOpenPreferredRecruitmentSeed(): Promise<GeminiRecruitmentOpenResult | null> {
    await this.gotoList('recruitment')
    await this.expectListShell('recruitment')
    const rowCount = await this.nonDraftDataRows().count()
    if (rowCount === 0) return null

    for (const title of GEMINI_VISITING_FEATURED_CANDIDATES) {
      try {
        const opened = await this.tryOpenRecruitmentByTitleOnce(title)
        if (opened) return opened
      } catch {
        continue
      }
    }
    return this.tryOpenFirstRecruitmentRow()
  }

  async tryOpenApprovedByInstitutionOnce(
    institutionName: string
  ): Promise<GeminiApprovedOpenResult | null> {
    await this.gotoList('approved')
    await this.expectListShell('approved')

    const row = this.dataRows().filter({ hasText: institutionName }).first()

    try {
      await expect(row).toBeVisible({ timeout: 8_000 })
    } catch {
      return null
    }

    await row.click()
    try {
      await expect(this.page).toHaveURL(/approvedTrainingId=/, { timeout: 20_000 })
    } catch {
      return null
    }

    const approvedTrainingId = new URL(this.page.url()).searchParams.get(
      'approvedTrainingId'
    )
    if (!approvedTrainingId) return null

    const shellOk = await this.tryExpectApprovedShellReady(20_000)
    if (!shellOk || (await this.isApprovedDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { approvedTrainingId, institutionName }
  }

  async tryOpenFirstApprovedRow(): Promise<GeminiApprovedOpenResult | null> {
    await this.gotoList('approved')
    await this.expectListShell('approved')

    const row = this.dataRows().first()
    try {
      await expect(row).toBeVisible({ timeout: 10_000 })
    } catch {
      return null
    }

    const institutionName =
      ((await row.innerText().catch(() => '')) ?? '').split('\n')[0]?.trim() ?? ''
    await row.click()
    try {
      await expect(this.page).toHaveURL(/approvedTrainingId=/, { timeout: 20_000 })
    } catch {
      return null
    }

    const approvedTrainingId = new URL(this.page.url()).searchParams.get(
      'approvedTrainingId'
    )
    if (!approvedTrainingId) return null

    const shellOk = await this.tryExpectApprovedShellReady(20_000)
    if (!shellOk || (await this.isApprovedDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return {
      approvedTrainingId,
      institutionName: institutionName || approvedTrainingId,
    }
  }

  async tryOpenPreferredApprovedSeed(): Promise<GeminiApprovedOpenResult | null> {
    await this.gotoList('approved')
    await this.expectListShell('approved')
    const rowCount = await this.dataRows().count()
    if (rowCount === 0) return null

    for (const name of GEMINI_APPROVED_INSTITUTION_CANDIDATES) {
      try {
        const opened = await this.tryOpenApprovedByInstitutionOnce(name)
        if (opened) return opened
      } catch {
        continue
      }
    }
    return this.tryOpenFirstApprovedRow()
  }

  async gotoRecruitmentDetail(
    recruitmentId: string,
    lnb: GeminiRecruitmentLnbKey = 'info'
  ): Promise<boolean> {
    const params = new URLSearchParams({ recruitmentId })
    if (lnb !== 'info') params.set('lnb', lnb)
    const url = `${LIST_PATH}?${params.toString()}`

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.page.goto(url)
      const shellOk = await this.tryExpectRecruitmentShellReady(attempt === 0 ? 20_000 : 30_000)
      if (!shellOk) {
        if (attempt < 2) await this.page.waitForTimeout(400)
        continue
      }
      if (await this.isRecruitmentDetailLoadFailed()) {
        if (attempt < 2) {
          await this.page.waitForTimeout(400)
          continue
        }
        return false
      }
      return true
    }
    return false
  }

  async gotoApprovedDetail(
    approvedTrainingId: string,
    lnb: GeminiApprovedLnbKey = 'info'
  ): Promise<boolean> {
    const params = new URLSearchParams({
      tab: 'approved',
      approvedTrainingId,
    })
    if (lnb !== 'info') params.set('approvedLnb', lnb)
    const url = `${LIST_PATH}?${params.toString()}`

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.page.goto(url)
      const shellOk = await this.tryExpectApprovedShellReady(attempt === 0 ? 20_000 : 30_000)
      if (!shellOk) {
        if (attempt < 2) await this.page.waitForTimeout(400)
        continue
      }
      if (await this.isApprovedDetailLoadFailed()) {
        if (attempt < 2) {
          await this.page.waitForTimeout(400)
          continue
        }
        return false
      }
      return true
    }
    return false
  }

  async tryGotoRecruitmentLnb(
    recruitmentId: string,
    lnb: GeminiRecruitmentLnbKey
  ): Promise<boolean> {
    const loaded = await this.gotoRecruitmentDetail(recruitmentId, lnb)
    if (!loaded) return false
    if (lnb !== 'info' && !this.page.url().includes(`lnb=${lnb}`)) return false
    await this.expectContentSettled()
    return true
  }

  async tryGotoApprovedLnb(
    approvedTrainingId: string,
    lnb: GeminiApprovedLnbKey
  ): Promise<boolean> {
    const loaded = await this.gotoApprovedDetail(approvedTrainingId, lnb)
    if (!loaded) return false
    if (lnb !== 'info' && !this.page.url().includes(`approvedLnb=${lnb}`)) return false
    await this.expectContentSettled()
    return true
  }

  async expectRecruitmentLnbVisible(label: string | RegExp) {
    await expect(this.recruitmentNav().getByText(label).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  async expectRecruitmentLnbHidden(label: string | RegExp) {
    const item = this.recruitmentNav().getByText(label).first()
    if ((await item.count()) === 0) return
    await expect(item).toBeHidden({ timeout: 5_000 })
  }

  async expectApprovedLnbVisible(label: string | RegExp) {
    await expect(this.approvedNav().getByText(label).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  async expectApprovedLnbHidden(label: string | RegExp) {
    const item = this.approvedNav().getByText(label).first()
    if ((await item.count()) === 0) return
    await expect(item).toBeHidden({ timeout: 5_000 })
  }

  async expectManagersShellVisible() {
    await expect(
      this.page
        .getByRole('dialog')
        .locator('.filter-table-layout__title')
        .filter({ hasText: '담당자 목록' })
        .first()
    ).toBeVisible({ timeout: 30_000 })
  }

  async tryExpectManagersShellVisible(timeoutMs = 15_000): Promise<boolean> {
    try {
      await expect(
        this.page
          .getByRole('dialog')
          .locator('.filter-table-layout__title')
          .filter({ hasText: '담당자 목록' })
          .first()
      ).toBeVisible({ timeout: timeoutMs })
      return true
    } catch {
      return this.page
        .getByRole('dialog')
        .getByText(/담당자/)
        .first()
        .isVisible()
        .catch(() => false)
    }
  }

  async expectContentSettled() {
    const content = this.page
      .locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body, .cms-data-table')
      .first()
    await expect(content).toBeVisible({ timeout: 30_000 })
  }

  async expectListOrEmptyInDialog() {
    await this.expectContentSettled()
    const table = this.page
      .getByRole('dialog')
      .locator('.cms-data-table, .ant-table, .filter-table-layout')
      .first()
    const empty = this.page
      .getByRole('dialog')
      .locator('.ant-empty, .ant-table-placeholder')
      .first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
  }

  async closeDetail() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  }
}
