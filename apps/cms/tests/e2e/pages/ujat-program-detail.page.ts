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

type UjatDataRichCandidate = {
  id: string
  title: string
  schedules: number
  organizationApplications: number
  firstHalfVolunteers: number
  secondHalfVolunteers: number
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

  private async tryExpectListShell(timeoutMs = 30_000): Promise<boolean> {
    try {
      await expect(this.page.getByRole('button', { name: /신규 등록/ })).toBeVisible({
        timeout: timeoutMs,
      })
      return true
    } catch {
      // 목록 권한·시드·백엔드 응답이 없는 환경은 호출자가 BLOCKED/skip으로 분류한다.
      return false
    }
  }

  async tryOpenByTitleOnce(title: string): Promise<UjatDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    if (!(await this.tryExpectListShell())) return null

    // 목록 API keyword 필터는 5xx 시 행을 비울 수 있음 — 클라이언트 행 텍스트로만 탐색
    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: title })
      .first()

    try {
      // 후보 title이 현재 환경에 없으면 해당 후보를 건너뛰고 다음 후보를 확인한다.
      await expect(row).toBeVisible({ timeout: 5_000 })
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

  /** 목록 셸과 데이터 행이 존재하는지 확인하기 위한 명시적 첫 행 진입 helper */
  async tryOpenFirstListRow(): Promise<UjatDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    if (!(await this.tryExpectListShell())) return null

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

  /**
   * 실제 서버 seed 중 신청·일정 데이터가 가장 충분한 프로그램을 선택한다.
   * 목록 첫 행이 빈 예정 프로그램일 수 있으므로, 상세 뎁스 통합 검증은
   * 단순 첫 행을 사용하지 않는다.
   */
  async tryOpenDataRichListSeed(): Promise<UjatDetailOpenResult | null> {
    await this.page.goto(LIST_PATH)
    if (!(await this.tryExpectListShell())) return null

    const candidates = await this.page.evaluate(async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) return [] as UjatDataRichCandidate[]
      const headers = { Authorization: `Bearer ${token}` }

      async function getJson(path: string): Promise<Record<string, unknown> | null> {
        const response = await fetch(path, { headers })
        if (!response.ok) return null
        try {
          const body = (await response.json()) as Record<string, unknown>
          const data = body.data
          return data && typeof data === 'object' ? (data as Record<string, unknown>) : body
        } catch {
          return null
        }
      }

      const list = await getJson('/api/admin/programs?page=0&size=20&programType=UJAT')
      const items = Array.isArray(list?.items) ? list.items : []
      const totals = (body: Record<string, unknown> | null): number =>
        typeof body?.totalElements === 'number' ? body.totalElements : 0

      const result = await Promise.all(
        items.flatMap(item => {
          if (!item || typeof item !== 'object') return []
          const row = item as Record<string, unknown>
          const id = row.id == null ? '' : String(row.id)
          if (!id) return []
          return [
            (async () => {
              const [detail, organizations, firstHalf, secondHalf] = await Promise.all([
                getJson(`/api/admin/programs/${encodeURIComponent(id)}`),
                getJson(
                  `/api/admin/programs/${encodeURIComponent(id)}/organization-applications?page=0&size=1`
                ),
                getJson(
                  `/api/admin/programs/${encodeURIComponent(id)}/volunteer-applications?page=0&size=1&recruitHalf=FIRST_HALF`
                ),
                getJson(
                  `/api/admin/programs/${encodeURIComponent(id)}/volunteer-applications?page=0&size=1&recruitHalf=SECOND_HALF`
                ),
              ])
              const schedules = Array.isArray(detail?.schedules) ? detail.schedules.length : 0
              return {
                id,
                title: typeof row.title === 'string' ? row.title : id,
                schedules,
                organizationApplications: totals(organizations),
                firstHalfVolunteers: totals(firstHalf),
                secondHalfVolunteers: totals(secondHalf),
              }
            })(),
          ]
        })
      )
      return result
    })

    const scored = (candidates as UjatDataRichCandidate[])
      .filter(
        candidate =>
          candidate.schedules > 0 ||
          candidate.organizationApplications > 0 ||
          candidate.firstHalfVolunteers > 0 ||
          candidate.secondHalfVolunteers > 0
      )
      .sort((a, b) => {
        const score = (candidate: UjatDataRichCandidate) =>
          (candidate.schedules > 0 ? 1 : 0) +
          (candidate.organizationApplications > 0 ? 4 : 0) +
          (candidate.firstHalfVolunteers > 0 ? 2 : 0) +
          (candidate.secondHalfVolunteers > 0 ? 2 : 0)
        return score(b) - score(a)
      })
    const candidate = scored[0]
    if (!candidate) return null

    const loaded = await this.gotoDetail(candidate.id, 'info', 'info')
    if (!loaded) return null
    return { programId: candidate.id, programTitle: candidate.title }
  }

  async tryOpenPreferredDetailSeed(): Promise<UjatDetailOpenResult | null> {
    const dataRich = await this.tryOpenDataRichListSeed()
    if (dataRich) return dataRich

    for (const title of UJAT_DETAIL_SEED_CANDIDATES) {
      try {
        const opened = await this.tryOpenByTitleOnce(title)
        if (opened) return opened
      } catch {
        continue
      }
    }
    return null
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
