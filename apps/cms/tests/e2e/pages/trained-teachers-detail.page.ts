/**
 * 교육받은 교사 프로그램 상세 POM (Phase 7)
 *
 * LNB: info · applicants · progress · survey? · managers
 * 없음: 강사 신청(applicant_instructors) · 봉사자
 * URL: /programs/trained-teachers?programId=&lnb=&tab=
 */

import { type Page, expect } from '@playwright/test'
import { TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES } from './trained-teachers-seed-titles'

export type TrainedTeachersDetailOpenResult = {
  programId: string
  programTitle: string
}

export type TrainedTeachersDetailLnbKey =
  | 'info'
  | 'applicants'
  | 'progress'
  | 'survey'
  | 'managers'

export type TrainedTeachersDetailTabKey = 'info' | 'institutions' | 'instructors'

const LIST_PATH = '/programs/trained-teachers'

export class TrainedTeachersDetailPage {
  constructor(private readonly page: Page) {}

  lnbNav() {
    return this.page.getByRole('navigation', { name: '프로그램 상세 메뉴' })
  }

  async tryExpectDetailShellReady(timeoutMs = 60_000): Promise<boolean> {
    try {
      await expect(this.lnbNav()).toBeVisible({ timeout: timeoutMs })
      const editOrClose = this.page
        .getByRole('button', { name: /정보 수정|닫기/ })
        .first()
      await expect(editOrClose).toBeVisible({ timeout: Math.min(20_000, timeoutMs) })
      return true
    } catch {
      return false
    }
  }

  async isProgramDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText(/프로그램 정보를 불러오지 못했습니다|찾을 수 없습니다/)
      .first()
      .isVisible()
      .catch(() => false)
  }

  private dataRows() {
    return this.page.locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
  }

  async tryOpenByTitleOnce(title: string): Promise<TrainedTeachersDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const row = this.dataRows().filter({ hasText: title }).first()
    try {
      await expect(row).toBeVisible({ timeout: 10_000 })
    } catch {
      return null
    }

    await row.click()
    try {
      await expect(this.page).toHaveURL(/programId=/, { timeout: 40_000 })
    } catch {
      return null
    }

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) return null

    const shellOk = await this.tryExpectDetailShellReady(20_000)
    if (!shellOk || (await this.isProgramDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { programId, programTitle: title }
  }

  async tryOpenFirstListRow(): Promise<TrainedTeachersDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const row = this.dataRows().first()
    try {
      await expect(row).toBeVisible({ timeout: 15_000 })
    } catch {
      return null
    }

    const programTitle =
      ((await row.innerText().catch(() => '')) ?? '').split('\n')[0]?.trim() ?? ''
    await row.click()
    try {
      await expect(this.page).toHaveURL(/programId=/, { timeout: 40_000 })
    } catch {
      return null
    }

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) return null

    const shellOk = await this.tryExpectDetailShellReady(20_000)
    if (!shellOk || (await this.isProgramDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { programId, programTitle: programTitle || programId }
  }

  async tryOpenPreferredDetailSeed(): Promise<TrainedTeachersDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
    await this.page
      .locator('.ant-spin-spinning')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined)

    const rowCount = await this.dataRows().count()
    if (rowCount === 0) return null

    // P0: TT-01 원문·[TT더미] 접두만 우선, 이후 첫 행
    const priority = TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES.slice(0, 4)
    for (const title of priority) {
      try {
        const opened = await this.tryOpenByTitleOnce(title)
        if (opened) return opened
      } catch {
        continue
      }
    }
    return this.tryOpenFirstListRow()
  }

  async gotoDetail(
    programId: string,
    lnb: TrainedTeachersDetailLnbKey = 'info',
    tab: TrainedTeachersDetailTabKey | string = 'info'
  ): Promise<boolean> {
    const url = `${LIST_PATH}?programId=${programId}&lnb=${lnb}&tab=${tab}`
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.page.goto(url)
      const shellOk = await this.tryExpectDetailShellReady(attempt === 0 ? 20_000 : 30_000)
      if (!shellOk) {
        if (attempt < 2) await this.page.waitForTimeout(400)
        continue
      }
      if (await this.isProgramDetailLoadFailed()) {
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

  async tryGotoLnb(
    programId: string,
    lnb: TrainedTeachersDetailLnbKey,
    tab: string
  ): Promise<boolean> {
    const loaded = await this.gotoDetail(programId, lnb, tab)
    if (!loaded) return false
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
    await this.expectContentSettled()
    return true
  }

  async expectUrlLnbTab(lnb: TrainedTeachersDetailLnbKey, tab?: string) {
    await expect(this.page).toHaveURL(new RegExp(`lnb=${lnb}`), { timeout: 15_000 })
    if (tab) {
      await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`), { timeout: 15_000 })
    }
  }

  async expectLnbVisible(label: string | RegExp) {
    await expect(this.lnbNav().getByText(label).first()).toBeVisible({ timeout: 15_000 })
  }

  async expectLnbHidden(label: string | RegExp) {
    const item = this.lnbNav().getByText(label).first()
    if ((await item.count()) === 0) return
    await expect(item).toBeHidden({ timeout: 5_000 })
  }

  async expectListShell() {
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
    const table = this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()
    const empty = this.page.locator('.ant-empty, .ant-table-placeholder').first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
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

  /** 상세 모달 안 데이터 행 (목록·기관 nested) */
  dialogDataRows() {
    return this.page
      .getByRole('dialog')
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
  }

  async dialogDataRowCount(): Promise<number> {
    return this.dialogDataRows().count()
  }

  /**
   * 기관 신청/참여 기관 첫 행 클릭 → schoolId 딥링크.
   * 행 없으면 null.
   */
  async tryOpenFirstInstitutionRow(): Promise<string | null> {
    const row = this.dialogDataRows().first()
    try {
      await expect(row).toBeVisible({ timeout: 10_000 })
    } catch {
      return null
    }
    await row.click()
    try {
      await expect(this.page).toHaveURL(/schoolId=/, { timeout: 30_000 })
    } catch {
      return null
    }
    return new URL(this.page.url()).searchParams.get('schoolId')
  }

  async gotoInstitutionDetail(
    programId: string,
    schoolId: string,
    opts: {
      lnb?: 'applicants' | 'progress'
      schoolTab?: 'application' | 'journal'
    } = {}
  ): Promise<boolean> {
    const lnb = opts.lnb ?? 'applicants'
    const schoolTab = opts.schoolTab ?? 'application'
    const tab = 'institutions'
    const params = new URLSearchParams({
      programId,
      lnb,
      tab,
      schoolId,
      schoolTab,
    })
    await this.page.goto(`${LIST_PATH}?${params.toString()}`)
    const shellOk = await this.tryExpectDetailShellReady(30_000)
    if (!shellOk) return false
    if (!this.page.url().includes(`schoolId=${schoolId}`)) return false
    await this.expectContentSettled()
    return true
  }

  async selectInstitutionDetailTab(tab: 'application' | 'journal'): Promise<boolean> {
    const label = tab === 'journal' ? '교육 일지' : '신청 정보'
    const tabEl = this.page.getByRole('tab', { name: label }).first()
    if (!(await tabEl.isVisible().catch(() => false))) {
      // CmsTextTabs 외 텍스트 클릭 폴백
      const byText = this.page.getByRole('dialog').getByText(label, { exact: true }).first()
      if (!(await byText.isVisible().catch(() => false))) return false
      await byText.click()
    } else {
      await tabEl.click()
    }
    try {
      await expect(this.page).toHaveURL(new RegExp(`schoolTab=${tab}`), { timeout: 15_000 })
    } catch {
      // URL 동기화 지연 시 콘텐츠만 확인
    }
    await this.expectContentSettled()
    return true
  }

  async expectJournalShellOrEmpty() {
    const title = this.page.getByRole('dialog').getByText(/교육\s*일지|교육일지 제출/).first()
    const empty = this.page
      .getByRole('dialog')
      .getByText(/제출된 교육일지가 없습니다/)
      .first()
    const table = this.page
      .getByRole('dialog')
      .locator('.trained-teachers-education-journal-section, .cms-data-table')
      .first()
    await expect(title.or(empty).or(table).first()).toBeVisible({ timeout: 20_000 })
  }

  async expectPerformanceSummaryIfPresent(): Promise<boolean> {
    const strip = this.page
      .locator('.trained-teachers-performance-summary-strip')
      .getByText('실적 요약')
      .first()
    return strip.isVisible().catch(() => false)
  }

  async closeDetail() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  }
}
