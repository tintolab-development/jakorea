/**
 * 프로그램관리 — 카테고리별 목록·셸 스모크 POM (Phase 1)
 *
 * 대시보드(`/`)를 거치지 않고 대상 경로로 직행합니다.
 */

import { type Locator, type Page, expect } from '@playwright/test'
import { expectAuthenticatedShell } from '../helpers/authenticated-shell'
import { EDITABLE_DUMMY_TITLE } from './general-program-seed-titles'
import { EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE } from './company-school-seed-titles'
import { EDITABLE_UJAT_DUMMY_TITLE } from './ujat-program-seed-titles'
import {
  GEMINI_PERFORMANCE_FEATURED_TEXT,
  GEMINI_VISITING_FEATURED_TITLE,
  GEMINI_VISITING_FEATURED_CANDIDATES,
} from './gemini-seed-titles'
import { TRAINED_TEACHERS_LIST_SMOKE_CANDIDATES } from './trained-teachers-seed-titles'

export type ProgramListSmokeCategory = {
  /** 스펙 단계 라벨 (예: 1.1) 일반) */
  id: string
  path: string
  /** 페이지·breadcrumb에서 기대하는 문구 */
  heading: RegExp
  /** 목록 진입 확인용 마커 (버튼·탭·타이틀) */
  listMarker: RegExp
  /** 시드 행이 있으면 상세 오픈 시도할 title 후보 */
  featuredTitles?: readonly string[]
  /** 상세 오픈 성공 시 URL에 나타날 쿼리 키 (없으면 dialog만) */
  detailUrlParam?: string
}

export const PROGRAM_LIST_SMOKE_CATEGORIES: readonly ProgramListSmokeCategory[] = [
  {
    id: '1.1) 일반 프로그램',
    path: '/programs/general',
    heading: /일반 프로그램/,
    listMarker: /프로그램 신규 등록/,
    featuredTitles: [EDITABLE_DUMMY_TITLE],
    detailUrlParam: 'programId',
  },
  {
    id: '1.2) 1사1교 프로그램',
    path: '/programs/company-school',
    heading: /1사1교/,
    listMarker: /프로그램 신규 등록/,
    featuredTitles: [EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE],
    detailUrlParam: 'programId',
  },
  {
    id: '1.3) UJAT 프로그램',
    path: '/programs/ujat',
    heading: /UJAT/,
    listMarker: /프로그램 신규 등록/,
    featuredTitles: [EDITABLE_UJAT_DUMMY_TITLE],
    detailUrlParam: 'programId',
  },
  {
    id: '1.4) UJAT 교육 지역',
    path: '/programs/ujat/regions',
    heading: /교육 지역/,
    listMarker: /교육 지역 등록/,
    // Phase 1: 진입·목록만 (CRUD는 기존 regions 스펙)
  },
  {
    id: '1.5) Gemini 찾아가는 연수',
    path: '/programs/gemini/visiting-training',
    heading: /찾아가는 연수|Gemini/,
    listMarker: /모집 공고|모집 공고 추가/,
    featuredTitles: [
      GEMINI_VISITING_FEATURED_TITLE,
      GEMINI_VISITING_FEATURED_CANDIDATES[1] ?? GEMINI_VISITING_FEATURED_TITLE,
    ],
    detailUrlParam: 'recruitmentId',
  },
  {
    id: '1.6) Gemini 실적 관리',
    path: '/programs/gemini/performance',
    heading: /실적/,
    listMarker: /연수 보고서 등록|전체 프로그램/,
    featuredTitles: [GEMINI_PERFORMANCE_FEATURED_TEXT],
  },
  {
    id: '1.7) 교육받은 교사 프로그램',
    path: '/programs/trained-teachers',
    heading: /교육받은 교사/,
    listMarker: /프로그램 신규 등록/,
    featuredTitles: TRAINED_TEACHERS_LIST_SMOKE_CANDIDATES,
    detailUrlParam: 'programId',
  },
] as const

export class ProgramListSmokePage {
  constructor(private readonly page: Page) {}

  async gotoList(path: string) {
    await this.page.goto(path)
  }

  async expectListShell(category: ProgramListSmokeCategory) {
    await expectAuthenticatedShell(this.page)
    await this.expectHeading(category.heading)
    await expect(this.page.getByText(category.listMarker).first()).toBeVisible({
      timeout: 30_000,
    })
    await this.expectTableOrEmpty()
  }

  async expectHeading(re: RegExp) {
    await expect(this.page.getByText(re).first()).toBeVisible({ timeout: 30_000 })
  }

  /** 메인 테이블 또는 Ant empty 상태 */
  async expectTableOrEmpty() {
    const table = this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()
    const empty = this.page.locator('.ant-empty, .ant-table-placeholder').first()
    await expect(table.or(empty).first()).toBeVisible({ timeout: 30_000 })
  }

  private tableRows(): Locator {
    return this.page.locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
  }

  /**
   * 목록에서 title 행을 찾아 클릭. 없으면 false (시드 부재 — 스펙에서 annotation).
   * 필터 placeholder가 있으면 조회 후 행을 찾습니다.
   */
  async tryOpenRowByTitle(
    title: string,
    options?: { detailUrlParam?: string; rowTimeoutMs?: number }
  ): Promise<boolean> {
    if (this.page.isClosed()) return false

    const rowTimeoutMs = options?.rowTimeoutMs ?? 5_000

    try {
      const titleFilter = this.page.getByPlaceholder(/프로그램명|모집|공고|강사/).first()
      if (
        (await titleFilter.count()) > 0 &&
        (await titleFilter.isVisible().catch(() => false))
      ) {
        await titleFilter.fill(title)
        const searchBtn = this.page.getByRole('button', { name: '조회' })
        if ((await searchBtn.count()) > 0 && (await searchBtn.isEnabled().catch(() => false))) {
          await searchBtn.click()
        }
      }

      const row = this.tableRows().filter({ hasText: title }).first()
      try {
        await expect(row).toBeVisible({ timeout: rowTimeoutMs })
      } catch {
        return false
      }

      await row.click()

      if (options?.detailUrlParam) {
        const param = options.detailUrlParam
        try {
          await expect(this.page).toHaveURL(new RegExp(`${param}=`), { timeout: 15_000 })
          return true
        } catch {
          // URL 파라미터가 달라도 풀페이지 모달만 열릴 수 있음
        }
      }

      const dialog = this.page.getByRole('dialog').first()
      try {
        await expect(dialog).toBeVisible({ timeout: 10_000 })
        return true
      } catch {
        return false
      }
    } catch {
      // 타임아웃으로 컨텍스트가 닫힌 경우 등
      return false
    }
  }

  /** featured 후보 중 하나로 상세 오픈 시도 (최대 3개 — Phase 1 목록 타임아웃 방지) */
  async tryOpenFeatured(category: ProgramListSmokeCategory): Promise<string | null> {
    const titles = category.featuredTitles
    if (!titles?.length) return null
    if (this.page.isClosed()) return null

    try {
      const rowCount = await this.tableRows().count()
      if (rowCount === 0) return null
    } catch {
      return null
    }

    const capped = titles.slice(0, 3)
    for (const title of capped) {
      if (this.page.isClosed()) return null
      const opened = await this.tryOpenRowByTitle(title, {
        detailUrlParam: category.detailUrlParam,
        rowTimeoutMs: 5_000,
      })
      if (opened) return title
    }
    return null
  }
}
