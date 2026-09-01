/**
 * 교육받은 교사 프로그램 E2E — BE/FE 시드 title 상수
 *
 * title 접두어 권장: `[TT더미]` — 일반·Gemini 등과 충돌 금지.
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md
 */

/** TT-01 — 목록·상세 smoke 우선 후보 (FE mock 원문) */
export const TRAINED_TEACHERS_FEATURED_TITLE =
  '2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램' as const

/** FE mock TT-01~08 title */
export const TRAINED_TEACHERS_FE_MOCK_TITLES = [
  TRAINED_TEACHERS_FEATURED_TITLE,
  '2026 SAP-함께 성장하니JA! 하계 고등학생 모집 안내',
  '2026 JA Korea 초등 교사 경제교육 직무연수',
  '2026 JA Korea 중등 교사 디지털 금융교육 연수',
  '2026 JA Korea 교사 경제교육 심화 과정',
  '2026 JA Korea 학교 금융교육 리더 교사 과정',
  '2026 JA Korea 진로·경제교육 교사 워크숍',
  '2026 JA Korea 교육받은 교사 프로그램 성과 공유회',
] as const

/** 목록 검색 후보 (BE `[TT더미]` 접두 변형 포함) — 상세 Phase 7–8용 */
export const TRAINED_TEACHERS_FEATURED_CANDIDATES = [
  TRAINED_TEACHERS_FEATURED_TITLE,
  `[TT더미] ${TRAINED_TEACHERS_FEATURED_TITLE}`,
  ...TRAINED_TEACHERS_FE_MOCK_TITLES.slice(1).flatMap(t => [t, `[TT더미] ${t}`] as const),
] as const

/** Phase 1 목록 스모크 — 후보를 짧게 유지 (전체 후보 순회 시 타임아웃) */
export const TRAINED_TEACHERS_LIST_SMOKE_CANDIDATES = [
  TRAINED_TEACHERS_FEATURED_TITLE,
  `[TT더미] ${TRAINED_TEACHERS_FEATURED_TITLE}`,
] as const

export const TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES = TRAINED_TEACHERS_FEATURED_CANDIDATES
