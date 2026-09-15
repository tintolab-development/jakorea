/**
 * 교육받은 교사 프로그램 E2E — BE Primary / FE 시드 title 상수
 *
 * QA SoT: Primary `186001`–`186008` (BE local demo).
 * title 접두어 권장: `[TT더미]` — 일반·Gemini 등과 충돌 금지.
 * @see apps/cms/docs/api/trained-teacher-primary-case-fe-adapter-2026-09-15.md
 */

/** Primary programId — 목록·상세 딥링크 smoke */
export const TRAINED_TEACHER_PRIMARY_PROGRAM_IDS = [
  '186001',
  '186002',
  '186003',
  '186004',
  '186005',
  '186006',
  '186007',
  '186008',
] as const

/** TCH-01 — 목록·상세 smoke 우선 후보 (FE mock 원문 · Primary title과 다를 수 있음) */
export const TRAINED_TEACHERS_FEATURED_TITLE =
  '2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램' as const

/** FE mock TT-01~08 title (레거시 후보 · Primary ON 시 BE title 우선) */
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

/** Phase 1 목록 스모크 — Primary id 딥링크 + 짧은 title 후보 */
export const TRAINED_TEACHERS_LIST_SMOKE_CANDIDATES = [
  TRAINED_TEACHERS_FEATURED_TITLE,
  `[TT더미] ${TRAINED_TEACHERS_FEATURED_TITLE}`,
] as const

export const TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES = TRAINED_TEACHERS_FEATURED_CANDIDATES

/** Primary 상세 딥링크 — `/programs/trained-teachers?programId=186001` */
export const TRAINED_TEACHERS_PRIMARY_DETAIL_PROGRAM_ID = '186001' as const
