/**
 * UJAT 프로그램 E2E 시드 title SSOT
 *
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md
 */

/** 상세 풀페이지 수정(CRUD U) 대상 — 국문 대표명은 식별용으로 변경하지 않음 */
export const EDITABLE_UJAT_DUMMY_TITLE = '[수정 가능] UJAT 프로그램 더미' as const

/** FE mock 목록 title (연도 치환) — L-01~L-05 공통 문구 */
export const UJAT_LIST_TITLE = (year = 2026) =>
  `${year}년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집`

/** BE 시드 접두어 권장 title */
export const UJAT_L01_SEED_TITLE = `[UJAT더미] ${UJAT_LIST_TITLE(2026)}` as const

/** 상세 smoke 우선 후보 (수정 더미 → L-01 FE/BE title) */
export const UJAT_DETAIL_SEED_CANDIDATES = [
  EDITABLE_UJAT_DUMMY_TITLE,
  UJAT_L01_SEED_TITLE,
  UJAT_LIST_TITLE(2026),
  UJAT_LIST_TITLE(2025),
] as const
