import { type Page, expect } from '@playwright/test'
import {
  COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES,
  EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE,
} from './company-school-seed-titles'

export type CompanySchoolDetailOpenResult = {
  programId: string
  programTitle: string
  usedCs01Seed?: boolean
}

/** URL `lnb` — 1사1교 ProgramDetailFullPageModal 키 (일반 institution_applications 등과 다름) */
export type CompanySchoolDetailLnbKey =
  | 'info'
  | 'applicants'
  | 'applicant_instructors'
  | 'progress'
  | 'survey'
  | 'managers'

/** URL `tab` — 정보: info|institutions|instructors · 진행: institutions|instructors */
export type CompanySchoolDetailTabKey = 'info' | 'institutions' | 'instructors'

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
        // FE mock 폴백으로 행이 보이면 목록 API 실패여도 진행
        if (!(await row.isVisible().catch(() => false))) {
          if (attempt < 2) {
            await this.page.waitForTimeout(300)
            continue
          }
          throw lastApiError
        }
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

      const programId = new URL(this.page.url()).searchParams.get('programId')
      if (!programId) {
        throw new Error('상세 URL에 programId 가 없습니다.')
      }

      // 상세 GET 5xx 등으로 LNB가 안 뜨면 다음 시드 후보로 (throw 금지)
      const shellOk = await this.tryExpectDetailShellReady(20_000)
      if (!shellOk || (await this.isProgramDetailLoadFailed())) {
        await this.closeDetail()
        return null
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

  /** CS-01 우선, 없으면 CS-EDIT */
  async openPreferredDetailSeed(): Promise<CompanySchoolDetailOpenResult> {
    for (const title of COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES) {
      const opened = await this.tryOpenByTitleOnce(title, 8_000)
      if (opened) {
        return {
          ...opened,
          usedCs01Seed: title === COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES[0],
        }
      }
    }
    return {
      ...(await this.openEditableDummy()),
      usedCs01Seed: false,
    }
  }

  async tryOpenPreferredDetailSeed(): Promise<CompanySchoolDetailOpenResult | null> {
    for (const title of COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES) {
      try {
        const opened = await this.tryOpenByTitleOnce(title, 8_000)
        if (opened) {
          return {
            ...opened,
            usedCs01Seed: title === COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES[0],
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // 목록/상세 일시 5xx — 다음 시드 후보
        if (
          message.includes('프로그램 목록 API 실패') ||
          message.includes('상세 셸')
        ) {
          continue
        }
        throw err
      }
    }
    return null
  }

  /** 공유 셸 aria-label: `프로그램 상세 메뉴` (레거시 `일반 프로그램 상세 메뉴`도 허용) */
  lnbNav() {
    return this.page.getByRole('navigation', { name: /프로그램 상세 메뉴/ })
  }

  async tryExpectDetailShellReady(timeoutMs = 60_000): Promise<boolean> {
    try {
      await expect(this.lnbNav()).toBeVisible({ timeout: timeoutMs })
      const editOrClose = this.page
        .getByRole('button', { name: /정보 수정|닫기|양식 수정/ })
        .first()
      await expect(editOrClose).toBeVisible({ timeout: Math.min(15_000, timeoutMs) })
      return true
    } catch {
      return false
    }
  }

  async expectDetailShellReady() {
    const ok = await this.tryExpectDetailShellReady(60_000)
    if (!ok) {
      throw new Error('1사1교 상세 셸(LNB)이 나타나지 않았습니다.')
    }
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

  lnbChildByLabel(label: string) {
    return this.lnbNav().locator(`[data-text="${label}"]`).first()
  }

  async expectLnbVisible(label: string | RegExp) {
    if (typeof label === 'string') {
      const byData = this.lnbChildByLabel(label)
      if ((await byData.count()) > 0) {
        await expect(byData).toBeVisible({ timeout: 15_000 })
        return
      }
    }
    await expect(this.lnbNav().getByText(label).first()).toBeVisible({ timeout: 15_000 })
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

  async ensureProgressAccordionOpen() {
    const progressLi = this.lnbNav()
      .locator('li')
      .filter({
        has: this.page.locator('.detail-fullpage-modal__lnb-item-label', {
          hasText: /프로그램 진행 현황|진행 현황/,
        }),
      })
      .first()
    const wrap = progressLi.locator('.detail-fullpage-modal__lnb-children-wrap').first()
    const open = await wrap
      .evaluate(el => el.classList.contains('detail-fullpage-modal__lnb-children-wrap--open'))
      .catch(() => false)
    if (open) return

    await progressLi.locator('.detail-fullpage-modal__lnb-item').first().click()
    await expect(wrap).toHaveClass(/lnb-children-wrap--open/, { timeout: 10_000 })
  }

  async expectProgressTabLabels(options: {
    mustHave?: readonly string[]
    mustNotHave?: readonly string[]
  }) {
    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) throw new Error('programId 없음')

    const opened = await this.tryGotoLnb(programId, 'progress', 'institutions')
    if (!opened) {
      await this.tryGotoLnb(programId, 'progress', 'instructors')
    }

    await this.ensureProgressAccordionOpen()

    for (const label of options.mustHave ?? []) {
      await expect(this.lnbChildByLabel(label)).toBeVisible({ timeout: 15_000 })
    }
    for (const label of options.mustNotHave ?? []) {
      await this.expectLnbHidden(label)
    }
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

  async goToInfoTab(tab: CompanySchoolDetailTabKey | 'recruitment' | 'application') {
    const mapped: CompanySchoolDetailTabKey =
      tab === 'recruitment' ? 'institutions' : tab === 'application' ? 'instructors' : tab
    const labels: Record<CompanySchoolDetailTabKey, string> = {
      info: '공통 정보',
      institutions: '모집 정보',
      instructors: '신청 정보',
    }
    await this.selectLnbChild(labels[mapped])
    await expect(this.page).toHaveURL(new RegExp(`tab=${mapped}`), { timeout: 15_000 })
  }

  async gotoDetail(
    programId: string,
    lnb: CompanySchoolDetailLnbKey = 'info',
    tab: string = 'info'
  ): Promise<boolean> {
    const url = `${LIST_PATH}?programId=${programId}&lnb=${lnb}&tab=${tab}`
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.page.goto(url)
      await this.expectDetailShellReady()
      const loaded = await this.waitForProgramDetailLoaded(attempt === 0 ? 10_000 : 15_000)
      if (loaded) return true
      if (attempt < 3) {
        await this.page.waitForTimeout(400)
      }
    }
    return !(await this.isProgramDetailLoadFailed())
  }

  async tryGotoLnb(
    programId: string,
    lnb: CompanySchoolDetailLnbKey,
    tab: string
  ): Promise<boolean> {
    const loaded = await this.gotoDetail(programId, lnb, tab)
    if (!loaded) return false
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
    if (await this.isProgramDetailLoadFailed()) return false
    await this.expectContentSettled()
    return true
  }

  async expectUrlLnbTab(lnb: CompanySchoolDetailLnbKey, tab?: string) {
    await expect(this.page).toHaveURL(new RegExp(`lnb=${lnb}`), { timeout: 15_000 })
    if (tab) {
      await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`), { timeout: 15_000 })
    }
  }

  async expectManagersShellVisible() {
    const dialog = this.page.getByRole('dialog')
    await expect(
      dialog.locator('.filter-table-layout__title').filter({ hasText: '담당자 목록' }).first()
    ).toBeVisible({ timeout: 30_000 })
  }

  async expectApplicationPreviewNotice() {
    if (await this.isProgramDetailLoadFailed()) {
      throw new Error('프로그램 상세 로드 실패 — 신청 정보 미리보기를 단언할 수 없습니다')
    }
    await expect(
      this.page
        .getByRole('dialog')
        .locator('.application-view__notice-text')
        .filter({ hasText: /양식 미리보기|미리보기 화면/ })
        .first()
    ).toBeVisible({ timeout: 30_000 })
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
