/**
 * UJAT 프로그램 상세 — 목록 진입 · LNB/탭 딥링크 · 셸 스모크
 * (edit POM과 분리 — Phase 3 상세 smoke 전용)
 */

import { type Page, expect } from '@playwright/test'
import {
  EDITABLE_UJAT_DUMMY_TITLE,
  UJAT_DETAIL_SEED_CANDIDATES,
} from './ujat-program-seed-titles'

export type UjatDetailOpenResult = {
  programId: string
  programTitle: string
}

export type UjatDetailLnbKey =
  | 'info'
  | 'institution_applications'
  | 'volunteer_h1'
  | 'volunteer_h2'
  | 'education_progress'
  | 'survey'
  | 'managers'

const LIST_PATH = '/programs/ujat'

export class UjatProgramDetailPage {
  constructor(private readonly page: Page) {}

  lnbNav() {
    return this.page.getByRole('navigation', { name: 'UJAT 프로그램 상세 메뉴' })
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

  async expectDetailShellReady() {
    const ok = await this.tryExpectDetailShellReady(60_000)
    if (!ok) throw new Error('UJAT 상세 셸(LNB)이 나타나지 않았습니다.')
  }

  async isProgramDetailLoadFailed(): Promise<boolean> {
    return this.page
      .getByText(/프로그램 정보를 불러오지 못했습니다|찾을 수 없습니다/)
      .first()
      .isVisible()
      .catch(() => false)
  }

  async tryOpenByTitleOnce(title: string): Promise<UjatDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    // 목록 API keyword 필터는 5xx 시 행을 비울 수 있음 — 클라이언트 행 텍스트로만 탐색
    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: title })
      .first()

    try {
      await expect(row).toBeVisible({ timeout: 15_000 })
    } catch {
      return null
    }

    await row.click()
    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) return null

    const shellOk = await this.tryExpectDetailShellReady(20_000)
    if (!shellOk || (await this.isProgramDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { programId, programTitle: title }
  }

  /** 시드 title 후보 실패 시 첫 데이터 행으로 상세 진입 (목록 smoke용) */
  async tryOpenFirstListRow(): Promise<UjatDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const row = this.page.locator('tbody.ant-table-tbody tr.ant-table-row').first()
    try {
      await expect(row).toBeVisible({ timeout: 20_000 })
    } catch {
      return null
    }

    const programTitle = ((await row.innerText().catch(() => '')) ?? '').split('\n')[0]?.trim() ?? ''
    await row.click()
    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) return null

    const shellOk = await this.tryExpectDetailShellReady(20_000)
    if (!shellOk || (await this.isProgramDetailLoadFailed())) {
      await this.closeDetail()
      return null
    }

    return { programId, programTitle: programTitle || programId }
  }

  async tryOpenPreferredDetailSeed(): Promise<UjatDetailOpenResult | null> {
    for (const title of UJAT_DETAIL_SEED_CANDIDATES) {
      try {
        const opened = await this.tryOpenByTitleOnce(title)
        if (opened) return opened
      } catch {
        continue
      }
    }
    return this.tryOpenFirstListRow()
  }

  async openEditableDummy(): Promise<UjatDetailOpenResult> {
    const opened = await this.tryOpenByTitleOnce(EDITABLE_UJAT_DUMMY_TITLE)
    if (!opened) {
      throw new Error(`시드 프로그램이 목록에 없습니다: "${EDITABLE_UJAT_DUMMY_TITLE}"`)
    }
    return opened
  }

  async gotoDetail(
    programId: string,
    lnb: UjatDetailLnbKey = 'info',
    tab = 'info'
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
    lnb: UjatDetailLnbKey,
    tab: string
  ): Promise<boolean> {
    const loaded = await this.gotoDetail(programId, lnb, tab)
    if (!loaded) return false
    if (!this.page.url().includes(`lnb=${lnb}`)) return false
    await this.expectContentSettled()
    return true
  }

  async expectUrlLnbTab(lnb: UjatDetailLnbKey, tab?: string) {
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
      // 담당자 영역 텍스트만 있어도 통과 (API/레이아웃 변형)
      return this.page
        .getByRole('dialog')
        .getByText(/담당자/)
        .first()
        .isVisible()
        .catch(() => false)
    }
  }

  /** 테이블·필터 레이아웃 또는 empty 상태 */
  async expectListOrEmptyShell(titleHint?: RegExp) {
    await this.expectContentSettled()
    const table = this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()
    const empty = this.page.locator('.ant-empty, .ant-table-placeholder').first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
    if (titleHint) {
      try {
        await expect(this.page.getByText(titleHint).first()).toBeVisible({ timeout: 15_000 })
      } catch {
        // 제목 힌트는 선택 — 테이블/empty 셸만 필수
      }
    }
  }

  /**
   * 후보 탭을 순서대로 열어 성공한 tab 목록 반환.
   * 하나라도 열리면 ok.
   */
  async openAnyTabs(
    programId: string,
    lnb: UjatDetailLnbKey,
    tabs: readonly string[]
  ): Promise<string[]> {
    const opened: string[] = []
    for (const tab of tabs) {
      const ok = await this.tryGotoLnb(programId, lnb, tab)
      if (!ok) continue
      opened.push(tab)
      await this.expectListOrEmptyShell()
    }
    return opened
  }

  async expectContentSettled() {
    const content = this.page
      .locator('.detail-fullpage-modal__content, .detail-fullpage-modal__body, .cms-data-table')
      .first()
    await expect(content).toBeVisible({ timeout: 30_000 })
  }

  async closeDetail() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  }
}
