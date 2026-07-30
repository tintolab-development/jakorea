/**
 * Gemini 실적 관리 POM (Phase 6)
 *
 * 찾아가는 연수(visiting-training)와 URL·게이트 분리 — 상세 풀페이지 없음(목록+업로드).
 */

import { type Page, expect } from '@playwright/test'
import {
  GEMINI_PERFORMANCE_FEATURED_TEXT,
  GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES,
} from './gemini-seed-titles'

const LIST_PATH = '/programs/gemini/performance'

export class GeminiPerformancePage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto(LIST_PATH)
  }

  async expectListShell() {
    await expect(this.page.getByRole('button', { name: '연수 보고서 등록' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.getByText('전체 프로그램').first()).toBeVisible({
      timeout: 15_000,
    })
    await this.expectTableOrEmpty()
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined)
  }

  async expectTableOrEmpty() {
    const table = this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()
    const empty = this.page.locator('.ant-empty, .ant-table-placeholder').first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
  }

  async expectFilterFieldsVisible() {
    await expect(this.page.getByText('강사', { exact: true }).first()).toBeVisible()
    await expect(this.page.getByText('연수방식', { exact: true }).first()).toBeVisible()
    await expect(this.page.getByText('연수장소', { exact: true }).first()).toBeVisible()
    await expect(this.page.getByText('연수일', { exact: true }).first()).toBeVisible()
    await expect(
      this.page.getByPlaceholder('강사명을 입력하세요')
    ).toBeVisible({ timeout: 10_000 })
  }

  async expectRegisterControls() {
    await expect(this.page.getByRole('button', { name: '연수 보고서 등록' })).toBeVisible()
    // 숨김 file input (엑셀 업로드)
    const fileInput = this.page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached({ timeout: 10_000 })
  }

  dataRows() {
    return this.page.locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
  }

  async rowCount(): Promise<number> {
    return this.dataRows().count()
  }

  async applyInstructorFilter(instructorName: string) {
    const input = this.page.getByPlaceholder('강사명을 입력하세요')
    await input.fill(instructorName)
    const searchBtn = this.page.getByRole('button', { name: /조회|검색/ }).first()
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click()
    } else {
      await input.press('Enter')
    }
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined)
  }

  async applyTrainingMethodFilter(label: '온라인' | '오프라인' | '전체'): Promise<boolean> {
    const methodSelect = this.page
      .locator('.table-filter-group__field, .filter-field, .ant-form-item, .table-filter-group__grid-cell')
      .filter({ hasText: '연수방식' })
      .locator('.ant-select')
      .first()

    if ((await methodSelect.count()) === 0) return false

    await methodSelect.click()
    const option = this.page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .first()

    try {
      await expect(option).toBeVisible({ timeout: 8_000 })
      await option.click()
    } catch {
      // ESC로 닫기
      await this.page.keyboard.press('Escape')
      return false
    }

    const searchBtn = this.page.getByRole('button', { name: /조회|검색/ }).first()
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click()
    }
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined)
    return true
  }

  /** 시드 강사 행이 보이면 true */
  async tryFindFeaturedInstructorRow(): Promise<boolean> {
    for (const name of [
      GEMINI_PERFORMANCE_FEATURED_TEXT,
      ...GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES,
    ]) {
      const row = this.dataRows().filter({ hasText: name }).first()
      if (await row.isVisible().catch(() => false)) return true
    }
    return false
  }

  async expectVisitingTrainingTabsAbsent() {
    await expect(this.page.getByRole('tab', { name: '모집 공고' })).toHaveCount(0)
    await expect(this.page.getByRole('tab', { name: '승인 연수' })).toHaveCount(0)
  }
}
