import { type Locator, type Page, expect } from '@playwright/test'
import {
  EDITABLE_DUMMY_TITLE,
  FULL_LNB_DUMMY_TITLE,
  FULL_LNB_TITLE_CANDIDATES,
  P0_SEED_TITLES,
  titlesForP0Case,
  type P0SeedCase,
} from './general-program-seed-titles'

export type DetailOpenResult = {
  programId: string
  programTitle: string
}

export type GeneralDetailLnbKey =
  | 'info'
  | 'institution_applications'
  | 'instructor_applications'
  | 'volunteer_applications'
  | 'progress'
  | 'survey'
  | 'managers'

/**
 * 일반 프로그램 상세 — 목록 진입 · LNB/탭 네비 · 딥링크
 */
export class GeneralProgramDetailPage {
  constructor(private readonly page: Page) {}

  /** GET 프로그램 목록(`/api/admin/programs`) — 상세·navigation 제외 */
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

  /**
   * 목록에서 title 1회 조회. 행이 없으면 null (후보 탐색용 — 긴 toPass 없음).
   * 목록 API가 응답하지 않으면(타임아웃) null — 다음 후보로 넘어감.
   */
  async tryOpenByTitleOnce(
    title: string,
    listTimeoutMs = 8_000
  ): Promise<DetailOpenResult | null> {
    await this.page.goto('/programs/general')
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

      // 응답 타임아웃(캐시·미발생)이어도 행이 보이면 성공으로 처리
      const rowWaitMs = listRes ? listTimeoutMs : Math.min(2_000, listTimeoutMs)
      try {
        await expect(row).toBeVisible({ timeout: rowWaitMs })
      } catch {
        // 네트워크 무응답이면 길게 재시도하지 않고 다음 후보로
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

  /** 목록에서 title 필터·행 클릭 → 상세 진입 (재시도 포함) */
  async openByTitle(title: string): Promise<DetailOpenResult> {
    let opened: DetailOpenResult | null = null
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

  /** title 후보를 순서대로 빠르게 시도. 없으면 null */
  async tryOpenByTitles(titles: readonly string[]): Promise<DetailOpenResult | null> {
    for (const title of titles) {
      try {
        const opened = await this.tryOpenByTitleOnce(title)
        if (opened) return opened
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // 일시 5xx는 다음 title 후보로 — 전부 실패 시에만 상위에서 처리
        if (!message.includes('프로그램 목록 API 실패(백엔드)')) throw err
      }
    }
    return null
  }

  /** P0 CASE 권장 title + FE alias로 열기 */
  async tryOpenP0Case(caseId: P0SeedCase): Promise<DetailOpenResult | null> {
    return this.tryOpenByTitles(titlesForP0Case(caseId))
  }

  async openEditableDummy(): Promise<DetailOpenResult> {
    return this.openByTitle(EDITABLE_DUMMY_TITLE)
  }

  /**
   * FULL LNB 시드(CASE-10) 우선, 없으면 수정 가능 더미로 fallback.
   * fallback 시 LNB 일부가 없을 수 있음 → 호출부에서 visible 여부 분기.
   */
  async openPreferredDetailSeed(): Promise<DetailOpenResult & { usedFullLnbSeed: boolean }> {
    const full = await this.tryOpenByTitles(FULL_LNB_TITLE_CANDIDATES)
    if (full) {
      return { ...full, usedFullLnbSeed: true }
    }
    const opened = await this.openEditableDummy()
    return { ...opened, usedFullLnbSeed: false }
  }

  async expectDetailShellReady() {
    const lnb = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    await expect(lnb).toBeVisible({ timeout: 60_000 })
    const editOrClose = this.page
      .getByRole('button', { name: /정보 수정|닫기|양식 수정/ })
      .first()
    await expect(editOrClose).toBeVisible({ timeout: 60_000 })
  }

  /** 상세 GET 실패 셸 — LNB는 열려도 본문 단언은 불가 */
  async isProgramDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText('프로그램 정보를 불러오지 못했습니다')
      .first()
      .isVisible()
      .catch(() => false)
  }

  /**
   * 셸 준비 후 상세 본문 로드 성공 여부.
   * 목록 페이지 FilterTableLayout 등과 혼동되지 않게 dialog 스코프만 본다.
   * 실패 문구가 2.5s 이상 유지되면 즉시 false(재시도는 gotoDetail이 담당).
   */
  async waitForProgramDetailLoaded(timeoutMs = 12_000): Promise<boolean> {
    const dialog = this.page.getByRole('dialog')
    const deadline = Date.now() + timeoutMs
    let failedSince: number | null = null
    while (Date.now() < deadline) {
      if (await this.isProgramDetailLoadFailed()) {
        if (failedSince == null) failedSince = Date.now()
        else if (Date.now() - failedSince >= 2_500) return false
        await this.page.waitForTimeout(300)
        continue
      }
      failedSince = null
      const heading = dialog.locator('.detail-fullpage-modal__header h2, header h2').first()
      const title = ((await heading.textContent().catch(() => '')) ?? '').trim()
      // 로드 실패·로딩 중 제목이 고정 "프로그램 상세"
      if (title && title !== '프로그램 상세') return true
      const contentReady = dialog
        .locator(
          [
            '.application-view__notice-text',
            '.detail-info-form',
            '.program-managers-tab',
            '.survey-management-view',
            '.filter-table-layout__title',
            '.recruitment-view',
          ].join(', ')
        )
        .first()
      if (await contentReady.isVisible().catch(() => false)) {
        if (!(await this.isProgramDetailLoadFailed())) return true
      }
      await this.page.waitForTimeout(250)
    }
    return false
  }

  /** 담당자 LNB 셸 — dialog 안 목록 제목 */
  async expectManagersShellVisible() {
    const dialog = this.page.getByRole('dialog')
    await expect(
      dialog.locator('.filter-table-layout__title').filter({ hasText: '담당자 목록' }).first()
    ).toBeVisible({ timeout: 30_000 })
  }

  /** 신청 정보 미리보기 안내 문구 */
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

  lnbNav() {
    return this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
  }

  /** LNB 자식 라벨 (`data-text` 우선 — 접힘 시 getByText만으로 불안정) */
  lnbChildByLabel(label: string) {
    return this.lnbNav().locator(`[data-text="${label}"]`).first()
  }

  /** LNB 라벨 노출 여부 (상위 텍스트 또는 자식 data-text) */
  async isLnbLabelVisible(label: string | RegExp): Promise<boolean> {
    if (typeof label === 'string') {
      const byData = this.lnbChildByLabel(label)
      if ((await byData.count()) > 0 && (await byData.isVisible().catch(() => false))) {
        return true
      }
    }
    const item = this.lnbNav().getByText(label).first()
    if ((await item.count()) === 0) return false
    return item.isVisible().catch(() => false)
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

  /** 진행 현황 아코디언이 닫혀 있으면만 연다 (이미 열린 상태면 토글하지 않음) */
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

  /**
   * 진행 현황 하위 탭 라벨 집합 단언.
   * `mustHave`는 모두 보여야 하고, `mustNotHave`는 없어야 함.
   */
  async expectProgressTabLabels(options: {
    mustHave?: readonly string[]
    mustNotHave?: readonly string[]
  }) {
    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) throw new Error('programId 없음')

    const opened = await this.tryGotoLnb(programId, 'progress', 'progress_participants')
    if (!opened) {
      await this.tryGotoLnb(programId, 'progress', 'progress_instructors')
    }

    await this.ensureProgressAccordionOpen()

    for (const label of options.mustHave ?? []) {
      await expect(this.lnbChildByLabel(label)).toBeVisible({ timeout: 15_000 })
    }
    for (const label of options.mustNotHave ?? []) {
      await this.expectLnbHidden(label)
    }
  }

  /** 상세 모달 본문 안 클릭 — sticky header/테이블이 가로챌 때 force */
  async clickInDetailContent(target: Locator, options?: { force?: boolean }) {
    await target.click({ force: options?.force ?? true, timeout: 15_000 })
  }

  /**
   * 상세 딥링크. BE 일시 5xx 대비 재시도.
   * @returns 본문 로드 성공 여부
   */
  async gotoDetail(
    programId: string,
    lnb: GeneralDetailLnbKey = 'info',
    tab = 'info'
  ): Promise<boolean> {
    const url = `/programs/general?programId=${programId}&lnb=${lnb}&tab=${tab}`
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.page.goto(url)
      await this.expectDetailShellReady()
      const loaded = await this.waitForProgramDetailLoaded(attempt < 2 ? 10_000 : 14_000)
      if (loaded) return true
      await this.page.waitForTimeout(400 * (attempt + 1))
    }
    return false
  }

  /** LNB 자식 라벨 클릭 (정확한 data-text 또는 텍스트) */
  async selectLnbChild(label: string) {
    const nav = this.lnbNav()
    const byDataText = nav.locator(`[data-text="${label}"]`).first()
    if ((await byDataText.count()) > 0 && (await byDataText.isVisible().catch(() => false))) {
      await byDataText.click()
      return
    }
    await nav.getByText(label, { exact: true }).first().click()
  }

  /** LNB 상위 항목 클릭 (아코디언 토글·단일 항목) */
  async selectLnbItem(label: string | RegExp) {
    await this.lnbNav().getByText(label).first().click()
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

  /**
   * LNB 항목이 보이면 클릭·URL 확인 후 true, 없으면 false.
   * 아코디언(진행·설문·면접 2depth)은 부모만 눌러도 URL이 안 바뀌므로
   * 자식을 열어 첫 하위 항목을 클릭한다.
   */
  async tryOpenLnb(
    label: string | RegExp,
    expectedLnb: GeneralDetailLnbKey,
    options?: { childLabel?: string | RegExp }
  ): Promise<boolean> {
    const nav = this.lnbNav()
    const item = nav.getByText(label).first()
    if ((await item.count()) === 0) return false
    if (!(await item.isVisible().catch(() => false))) return false

    await item.click()

    const urlAfterParent = this.page.url()
    if (!urlAfterParent.includes(`lnb=${expectedLnb}`)) {
      const child =
        options?.childLabel != null
          ? nav.getByText(options.childLabel).first()
          : nav
              .locator(
                '.detail-fullpage-modal__lnb-children-wrap--open .detail-fullpage-modal__lnb-child-label'
              )
              .first()
      if ((await child.count()) === 0 || !(await child.isVisible().catch(() => false))) {
        const programId = new URL(this.page.url()).searchParams.get('programId')
        if (!programId) return false
        const defaultTab =
          expectedLnb === 'progress'
            ? 'progress_participants'
            : expectedLnb === 'survey'
              ? 'survey'
              : expectedLnb === 'volunteer_applications'
                ? 'vol_all'
                : 'main'
        await this.gotoDetail(programId, expectedLnb, defaultTab)
      } else {
        await child.click()
      }
    }

    await expect(this.page).toHaveURL(new RegExp(`lnb=${expectedLnb}`), { timeout: 15_000 })
    const body = this.page.locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body')
    await expect(body.first()).toBeVisible({ timeout: 30_000 })
    return true
  }

  /** 딥링크로 LNB 진입 — 네비게이션/meta 로 막혀도 URL·본문만 확인 */
  async tryGotoLnb(programId: string, lnb: GeneralDetailLnbKey, tab: string): Promise<boolean> {
    await this.gotoDetail(programId, lnb, tab)
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
    if (await this.isProgramDetailLoadFailed()) return false
    await this.expectContentSettled()
    return true
  }

  async expectUrlLnbTab(lnb: GeneralDetailLnbKey, tab?: string) {
    await expect(this.page).toHaveURL(new RegExp(`lnb=${lnb}`), { timeout: 15_000 })
    if (tab) {
      await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`), { timeout: 15_000 })
    }
  }

  async closeDetail() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  }

  /** 상세 본문이 로딩 후 안정적인지 (빈 화면·미해결 스피너만 아닌지) */
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

  /** 공통 정보 본문에 회차(복수) 표기가 있는지 */
  async expectCommonInfoHasMultiRoundMarkers(): Promise<boolean> {
    await this.goToInfoTab('info')
    await this.expectContentSettled()
    const body = this.page.locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body')
    const text = await body.first().innerText().catch(() => '')
    return /회차|차시|■\s*\d/.test(text)
  }
}

export { P0_SEED_TITLES, FULL_LNB_DUMMY_TITLE }
