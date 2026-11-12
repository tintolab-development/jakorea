import type { GeminiRecruitmentRemoteFilters } from '../../api/visiting-training/client'
import { mapGeminiRecruitmentUiStatusToPeriodStatusWire } from './map-period-status-wire'

/** 목록 URL(`gvt_*`)에서 읽은 조회 조건 — 화면 필터 값 그대로 */
export type GeminiRecruitmentListUiFilters = {
  title?: string
  status?: string
  /** `YYYY-MM-DD` 연수요청기간 시작 */
  from?: string
  /** `YYYY-MM-DD` 연수요청기간 끝 */
  to?: string
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function toDateKey(raw: string | undefined): string | undefined {
  const value = raw?.trim()
  return value && DATE_KEY.test(value) ? value : undefined
}

function toDraftStatusWire(
  uiStatus: string | undefined
): GeminiRecruitmentRemoteFilters['draftStatus'] {
  const normalized = uiStatus?.trim().toUpperCase()
  if (!normalized || normalized === 'ALL') return undefined
  if (normalized === 'DRAFT') return 'DRAFT'
  // 예정·모집중·종료는 게시된 공고만 대상이다(미게시 제외).
  if (normalized === 'SCHEDULED' || normalized === 'IN_PROGRESS' || normalized === 'ENDED') {
    return 'PUBLISHED'
  }
  return undefined
}

/**
 * 모집 공고 목록 화면 조건 → `GET /recruitments` 서버 검색 조건.
 * 모든 조건은 서버가 걸러야 `totalElements`(총 N건)와 표 행 수가 맞는다.
 */
export function toGeminiRecruitmentRemoteFilters(
  filters: GeminiRecruitmentListUiFilters
): GeminiRecruitmentRemoteFilters {
  return {
    keyword: filters.title?.trim() || undefined,
    periodStatus: mapGeminiRecruitmentUiStatusToPeriodStatusWire(filters.status),
    draftStatus: toDraftStatusWire(filters.status),
    trainingRequestFrom: toDateKey(filters.from),
    trainingRequestTo: toDateKey(filters.to),
  }
}
