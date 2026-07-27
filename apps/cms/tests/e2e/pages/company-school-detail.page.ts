import { type Page, expect } from '@playwright/test'
import { EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE } from './company-school-seed-titles'

export type CompanySchoolDetailOpenResult = {
  programId: string
  programTitle: string
}

export type CompanySchoolDetailLnbKey =
  | 'info'
  | 'institution_applications'
  | 'instructor_applications'
  | 'progress'
  | 'survey'
  | 'managers'

const LIST_PATH = '/programs/company-school'

/**
 * 1사1교 프로그램 상세 — 목록 진입 · LNB/탭 네비 · 딥링크
 * (일반 POM과 분리 — 라우트·시드·봉사자 부재)
 */
export class CompanySchoolDetailPage {
  constructor(private readonly page: Page) {}

  private isProgramsListGet(
    res: { request: () => { method: () => string }; url: () => string },
    keyword?: string
  ): boolean {
    if (res.request().method() !== 'GET') return false
    let url: URL
    try {
      url = new URL(res.url())
    } catch {
      return false
    }
    const path = url.pathname.replace(/\/$/, '')
    if (path !== '/api/admin/programs') return false
    if (keyword == null || keyword === '') return true
    const kw = url.searchParams.get('keyword')
    if (kw == null) return false
    try {
      return kw === keyword || decodeURIComponent(kw) === keyword
    } catch {
      return kw === keyword
    }
  }

  async tryOpenByTitleOnce(
    title: string,
    listTimeoutMs = 8_000
  ): Promise<CompanySchoolDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력하세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })
    await titleFilter.fill(title)

    const searchBtn = this.page.getByRole('button', { name: '조회' })
    await expect(searchBtn).toBeEnabled({ timeout: 15_000 })

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: title })
      .first()

    let lastApiError: Error | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const listWait = this.page
        .waitForResponse(res => this.isProgramsListGet(res, title), { timeout: 12_000 })
        .catch(() => null)

      await searchBtn.click()
      const listRes = await listWait

      if (listRes && !listRes.ok()) {
        const body = await listRes.text().catch(() => '')
        lastApiError = new Error(
          [
            `프로그램 목록 API 실패(백엔드): HTTP ${listRes.status()}`,
            listRes.url(),
            body.slice(0, 300) || '(empty body)',
          ].join('\n')
        )
        if (listRes.status() >= 500 && attempt < 2) {
          await this.page.waitForTimeout(400)
          continue
        }
        throw lastApiError
      }

      const rowWaitMs = listRes ? listTimeoutMs : Math.min(2_000, listTimeoutMs)
      try {
        await expect(row).toBeVisible({ timeout: rowWaitMs })
      } catch {
        if (!listRes) return null
        if (attempt < 2) {
          await this.page.waitForTimeout(300)
          continue
        }
        return null
      }

      await row.click()
      await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })
      await this.expectDetailShellReady()

      const programId = new URL(this.page.url()).searchParams.get('programId')
      if (!programId) {
        throw new Error('상세 URL에 programId 가 없습니다.')
      }

      return { programId, programTitle: title }
    }

    if (lastApiError) throw lastApiError
    return null
  }

  async openByTitle(title: string): Promise<CompanySchoolDetailOpenResult> {
    let opened: CompanySchoolDetailOpenResult | null = null
    try {
      await expect(async () => {
        opened = await this.tryOpenByTitleOnce(title, 8_000)
        if (!opened) {
          throw new Error(`시드 프로그램이 목록에 없습니다: "${title}"`)
        }
      }).toPass({ timeout: 90_000 })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      if (detail.includes('프로그램 목록 API 실패(백엔드)')) {
        throw err
      }
      throw new Error(
        `시드 프로그램이 목록에 없습니다: "${title}". BE 시드·title 충돌 여부를 확인하세요.\n원인: ${detail}`
      )
    }
    if (!opened) {
      throw new Error(
        `시드 프로그램이 목록에 없습니다: "${title}". BE 시드·title 충돌 여부를 확인하세요.`
      )
    }
    return opened
  }

  async openEditableDummy(): Promise<CompanySchoolDetailOpenResult> {
    return this.openByTitle(EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE)
  }

  async expectDetailShellReady() {
    // 공유 상세 셸 — aria-label은 일반과 동일
    const lnb = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    await expect(lnb).toBeVisible({ timeout: 60_000 })
    const editOrClose = this.page
      .getByRole('button', { name: /정보 수정|닫기|양식 수정/ })
      .first()
    await expect(editOrClose).toBeVisible({ timeout: 60_000 })
  }

  async isProgramDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText('프로그램 정보를 불러오지 못했습니다')
      .first()
      .isVisible()
      .catch(() => false)
  }

  async waitForProgramDetailLoaded(timeoutMs = 12_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (await this.isProgramDetailLoadFailed()) return false
      const heading = this.page.locator('.detail-fullpage-modal__header h2, header h2').first()
      const title = ((await heading.textContent().catch(() => '')) ?? '').trim()
      if (title && title !== '프로그램 상세') return true
      const contentReady = this.page
        .locator(
          [
            '.filter-table-layout__title',
            '.application-view__notice-text',
            '.detail-info-form',
            '.program-managers-tab',
            '.survey-management-view',
          ].join(', ')
        )
        .first()
      if (await contentReady.isVisible().catch(() => false)) return true
      await this.page.waitForTimeout(250)
    }
    return !(await this.isProgramDetailLoadFailed())
  }

  lnbNav() {
    return this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
  }

  lnbChildByLabel(label: string) {
    return this.lnbNav().locator(`[data-text="${label}"]`).first()
  }

  async expectLnbHidden(label: string | RegExp) {
    if (typeof label === 'string') {
      const byData = this.lnbNav().locator(`[data-text="${label}"]`)
      if ((await byData.count()) === 0) return
      await expect(byData.first()).toBeHidden({ timeout: 5_000 })
      return
    }
    const item = this.lnbNav().getByText(label).first()
    if ((await item.count()) === 0) return
    await expect(item).toBeHidden({ timeout: 5_000 })
  }

  async selectLnbChild(label: string) {
    const nav = this.lnbNav()
    const byDataText = nav.locator(`[data-text="${label}"]`).first()
    if ((await byDataText.count()) > 0 && (await byDataText.isVisible().catch(() => false))) {
      await byDataText.click()
      return
    }
    await nav.getByText(label, { exact: true }).first().click()
  }

  async goToInfoTab(tab: 'info' | 'recruitment' | 'application') {
    const labels = {
      info: '공통 정보',
      recruitment: '모집 정보',
      application: '신청 정보',
    } as const
    await this.selectLnbChild(labels[tab])
    await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`), { timeout: 15_000 })
  }

  async gotoDetail(
    programId: string,
    lnb: CompanySchoolDetailLnbKey = 'info',
    tab = 'info'
  ) {
    const url = `${LIST_PATH}?programId=${programId}&lnb=${lnb}&tab=${tab}`
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.page.goto(url)
      await this.expectDetailShellReady()
      const loaded = await this.waitForProgramDetailLoaded(attempt === 0 ? 10_000 : 15_000)
      if (loaded) return
      if (attempt < 2) {
        await this.page.waitForTimeout(400)
      }
    }
  }

  async tryGotoLnb(
    programId: string,
    lnb: CompanySchoolDetailLnbKey,
    tab: string
  ): Promise<boolean> {
    await this.gotoDetail(programId, lnb, tab)
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
    if (await this.isProgramDetailLoadFailed()) return false
    await this.expectContentSettled()
    return true
  }

  async expectContentSettled() {
    const content = this.page
      .locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body, .cms-data-table')
      .first()
    await expect(content).toBeVisible({ timeout: 30_000 })
    const fullSpin = this.page.locator('.detail-fullpage-modal__loading')
    if ((await fullSpin.count()) > 0) {
      await expect(fullSpin.first()).toBeHidden({ timeout: 60_000 }).catch(() => undefined)
    }
  }

  async closeDetail() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  }
}
