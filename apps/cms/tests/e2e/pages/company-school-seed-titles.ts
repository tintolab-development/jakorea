/**
 * 1사1교 프로그램 E2E — BE 시드 title 상수
 *
 * `[수정 가능] 1사1교 프로그램 더미` 와 CASE title을 같게 만들거나 덮어쓰지 마세요.
 * 일반 E2E title(`[수정 가능] 일반 프로그램 더미` 등)과도 충돌 금지.
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md
 */

/** 수정 E2E 전용 공유 더미 (대표명 국문은 변경하지 않음) — CS-EDIT */
export const EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE = '[수정 가능] 1사1교 프로그램 더미'

/** CS-01 — planned · 설문 none · FULL LNB−설문 (상세 smoke 우선) */
export const CS01_DETAIL_SEED_TITLE =
  'HSBC/HKU Business Case Competition 2026 모집 안내' as const

/** 상세 smoke / LNB 격리 — 우선 후보 (CS-01 → CS-EDIT) */
export const COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES = [
  CS01_DETAIL_SEED_TITLE,
  EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE,
] as const

/** P0 lifecycle 매트릭스 (CS-01~08) — Phase 2+ 확장용 */
export const CS_P0_SEED_TITLES = {
  'CS-01': CS01_DETAIL_SEED_TITLE,
  'CS-02': '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
  'CS-03': 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
  'CS-04': '2026년 JA Korea 초등 경제교육 모집 안내',
  'CS-05': '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
  'CS-06':
    '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
  'CS-07': '2026년 JA Korea 경제금융교육 전문강사단 모집',
  'CS-08': '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
} as const
