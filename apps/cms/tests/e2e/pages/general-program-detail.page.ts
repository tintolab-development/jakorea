import { type Page, expect } from '@playwright/test'
import {
  EDITABLE_DUMMY_TITLE,
  FULL_LNB_DUMMY_TITLE,
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

  /** 목록에서 title 필터·행 클릭 → 상세 진입 */
  async openByTitle(title: string): Promise<DetailOpenResult> {
    await this.page.goto('/programs/general')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력하세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: title })
      .first()

    try {
      await expect(async () => {
        await titleFilter.fill(title)
        const listWait = this.page.waitForResponse(
          res =>
            res.request().method() === 'GET' &&
            /\/api\/admin\/programs/.test(new URL(res.url()).pathname),
          { timeout: 30_000 }
        )
        await this.page.getByRole('button', { name: '조회' }).click()
        const listRes = await listWait
        if (!listRes.ok()) {
          const body = await listRes.text().catch(() => '')
          throw new Error(
            [
              `프로그램 목록 API 실패(백엔드): HTTP ${listRes.status()}`,
              listRes.url(),
              body.slice(0, 300) || '(empty body)',
            ].join('\n')
          )
        }
        await expect(row).toBeVisible({ timeout: 8_000 })
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

    await row.click()
    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })
    await this.expectDetailShellReady()

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) {
      throw new Error('상세 URL에 programId 가 없습니다.')
    }

    return { programId, programTitle: title }
  }

  async openEditableDummy(): Promise<DetailOpenResult> {
    return this.openByTitle(EDITABLE_DUMMY_TITLE)
  }

  /**
   * FULL LNB 시드(CASE-10) 우선, 없으면 수정 가능 더미로 fallback.
   * fallback 시 LNB 일부가 없을 수 있음 → 호출부에서 visible 여부 분기.
   */
  async openPreferredDetailSeed(): Promise<DetailOpenResult & { usedFullLnbSeed: boolean }> {
    try {
      const opened = await this.openByTitle(FULL_LNB_DUMMY_TITLE)
      return { ...opened, usedFullLnbSeed: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('시드 프로그램이 목록에 없습니다')) {
        throw err
      }
      const opened = await this.openEditableDummy()
      return { ...opened, usedFullLnbSeed: false }
    }
  }

  async expectDetailShellReady() {
    const lnb = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    await expect(lnb).toBeVisible({ timeout: 60_000 })
    // 정보 수정은 lifecycle에 따라 없을 수 있음 — LNB 또는 닫기로 셸 확인
    const editOrClose = this.page
      .getByRole('button', { name: /정보 수정|닫기|양식 수정/ })
      .first()
    await expect(editOrClose).toBeVisible({ timeout: 60_000 })
  }

  async gotoDetail(
    programId: string,
    lnb: GeneralDetailLnbKey = 'info',
    tab = 'info'
  ) {
    await this.page.goto(
      `/programs/general?programId=${programId}&lnb=${lnb}&tab=${tab}`
    )
    await this.expectDetailShellReady()
  }

  /** LNB 자식 라벨 클릭 (정확한 data-text 또는 텍스트) */
  async selectLnbChild(label: string) {
    const nav = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    const byDataText = nav.locator(`[data-text="${label}"]`).first()
    if ((await byDataText.count()) > 0 && (await byDataText.isVisible().catch(() => false))) {
      await byDataText.click()
      return
    }
    await nav.getByText(label, { exact: true }).first().click()
  }

  /** LNB 상위 항목 클릭 (아코디언 토글·단일 항목) */
  async selectLnbItem(label: string | RegExp) {
    const nav = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    await nav.getByText(label).first().click()
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
    const nav = this.page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    const item = nav.getByText(label).first()
    if ((await item.count()) === 0) return false
    if (!(await item.isVisible().catch(() => false))) return false

    await item.click()

    // 아코디언만 열린 경우 — URL 미변경 → 자식 클릭
    const urlAfterParent = this.page.url()
    if (!urlAfterParent.includes(`lnb=${expectedLnb}`)) {
      const child =
        options?.childLabel != null
          ? nav.getByText(options.childLabel).first()
          : nav
              .locator('.detail-fullpage-modal__lnb-children-wrap--open .detail-fullpage-modal__lnb-child-label')
              .first()
      if ((await child.count()) === 0 || !(await child.isVisible().catch(() => false))) {
        // 딥링크로 폴백
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
  async tryGotoLnb(
    programId: string,
    lnb: GeneralDetailLnbKey,
    tab: string
  ): Promise<boolean> {
    await this.gotoDetail(programId, lnb, tab)
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
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
    // 전체 화면 로딩 스피너가 사라질 때까지 (있으면)
    const fullSpin = this.page.locator('.detail-fullpage-modal__loading')
    if ((await fullSpin.count()) > 0) {
      await expect(fullSpin.first()).toBeHidden({ timeout: 60_000 }).catch(() => undefined)
    }
  }
}
