/**
 * 프로그램 유형별 「프론트 화면(UI) 완성도」SSOT.
 * API/remote 연동과 분리 — mock 데이터로 렌더·네비 가능한 화면 기준.
 *
 * 근거: CMS 기능정의서 Notion 대조 (2026-07-31) · UI-only 재판정
 */

import type { BackendDummyCategoryId } from './types'

/** Notion `화면 개발` vs 실제 FE UI 정렬 */
export type NotionUiAlignment = 'aligned' | 'understated' | 'overstated'

export interface ProgramUiCompletenessRow {
  categoryId: BackendDummyCategoryId
  /** 0–100 — 목록·상세 LNB·핵심 탭 UI 존재 비중 */
  uiPct: number
  /** Notion 상태 대비 UI 현실 */
  notionAlignment: NotionUiAlignment
  /** Notion `화면 개발` 요약 (수동) */
  notionScreenDevSummary: string
  /** 한 줄 판정 */
  verdict: string
  /** 불일치·잔여 stub */
  mismatches: readonly string[]
}

export const PROGRAM_UI_COMPLETENESS_AS_OF = '2026-07-31'

export const PROGRAM_UI_COMPLETENESS_ROWS: readonly ProgramUiCompletenessRow[] = [
  {
    categoryId: 'general',
    uiPct: 94,
    notionAlignment: 'understated',
    notionScreenDevSummary: '대부분 프론트 완료 · 공통/기관 6건 시작 전·진행 중',
    verdict: 'UI 높음. Notion이 일부 화면을 과소 표기.',
    mismatches: [
      '단계 별 프로그램·캘린더뷰: Notion 진행 중 → UI 완료',
      '캘린더뷰_공통 정책: Notion 시작 전 → 캘린더 서피스 존재',
      '봉사자 신청 정보·신청 기관 상세: Notion 진행 중 → UI 완료',
      '과제·설문 제출 내역 팝업: Notion 시작 전 → 모달 존재(기관 상세 진입·일괄다운 부분)',
      '일부 배정/출석·알림 액션: 준비 중 stub',
    ],
  },
  {
    categoryId: 'company-school',
    uiPct: 96,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '전부 프론트 완료 (17)',
    verdict: '코어 LNB UI 완료. 봉사자·과제 UI 없음은 도메인 정상.',
    mismatches: ['공유 셸 알림/미리보기 등 준비 중 stub'],
  },
  {
    categoryId: 'ujat',
    uiPct: 95,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '전부 프론트 완료 (69)',
    verdict: '목록·등록·상세 LNB·지역배정 UI 밀도 높음 (API는 별도 mock).',
    mismatches: ['동의서 문서·일부 출결 액션: 준비 중 stub'],
  },
  {
    categoryId: 'ujat-regions',
    uiPct: 98,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '교육 지역 관리 UI 완료',
    verdict: 'CRUD·정렬 UI 완료.',
    mismatches: [],
  },
  {
    categoryId: 'gemini-visiting',
    uiPct: 94,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '전부 프론트 완료 (모집·승인 관련)',
    verdict: '모집/승인 목록·상세 셸 존재.',
    mismatches: ['강사 신청·승인 상세는 UI 있으나 일부 매핑 약함'],
  },
  {
    categoryId: 'gemini-performance',
    uiPct: 88,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '실적 관리 프론트 완료',
    verdict: '목록·import UI 존재. 삭제 UX stub.',
    mismatches: ['실적 행 삭제: 준비 중/미노출 수준'],
  },
  {
    categoryId: 'trained-teachers',
    uiPct: 95,
    notionAlignment: 'aligned',
    notionScreenDevSummary: '전부 프론트 완료 (12)',
    verdict: '목록·상세·기관·교육일지 UI 완료.',
    mismatches: [
      '목록 봉사자 모집 컬럼 잔존 등 스펙↔UI 드리프트(기능 셸은 있음)',
      'managers·설문 answers UI polish 잔여',
    ],
  },
]

const BY_ID = new Map(PROGRAM_UI_COMPLETENESS_ROWS.map(row => [row.categoryId, row]))

export function getProgramUiCompleteness(
  categoryId: BackendDummyCategoryId
): ProgramUiCompletenessRow | undefined {
  return BY_ID.get(categoryId)
}

export function notionUiAlignmentLabel(alignment: NotionUiAlignment): string {
  switch (alignment) {
    case 'aligned':
      return 'Notion↔UI 일치'
    case 'understated':
      return 'Notion 과소'
    case 'overstated':
      return 'Notion 과대'
  }
}

/** programs 탭 평균 UI% (해당 행만) */
export function averageProgramUiPct(
  categoryIds: readonly BackendDummyCategoryId[]
): number | null {
  const rows = categoryIds
    .map(id => BY_ID.get(id))
    .filter((row): row is ProgramUiCompletenessRow => row != null)
  if (rows.length === 0) return null
  const sum = rows.reduce((acc, row) => acc + row.uiPct, 0)
  return Math.round(sum / rows.length)
}
