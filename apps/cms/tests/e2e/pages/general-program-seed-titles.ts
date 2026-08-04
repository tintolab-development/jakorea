/**
 * 일반 프로그램 E2E — BE 시드 title 상수
 *
 * BE 권장 title(문서 §1)을 우선. FE mock `【유형·N】` 접두어 시드는 alias로 보조 검색.
 * `[수정 가능] 일반 프로그램 더미` 와 CASE title을 같게 만들거나 덮어쓰지 마세요.
 * @see apps/cms/docs/api/general-program-dummy-seed-backend-request.md
 */

/** 수정 E2E 전용 공유 더미 (대표명 국문은 변경하지 않음) */
export const EDITABLE_DUMMY_TITLE = '[수정 가능] 일반 프로그램 더미'

/** CASE-10 — LNB full (강사·봉사 면접 2depth·설문 full). 상세 smoke 권장 시드 */
export const FULL_LNB_DUMMY_TITLE =
  '【LNB·16】강사 있음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 4항목)'

/** FULL LNB 검색 후보 (BE/레거시 단축 title) */
export const FULL_LNB_TITLE_CANDIDATES = [
  FULL_LNB_DUMMY_TITLE,
  '【LNB】강사O · 봉사면접2depth · 설문full',
] as const

/** P0 — 유형 8종 + 교육·IPS 일정별 상이 (CASE-01~09) */
export const P0_SEED_TITLES = {
  'CASE-01': '일반 프로그램 (기관)_커리큘럼형_단일 회차',
  'CASE-02': '일반 프로그램 (기관)_커리큘럼형_복수 회차',
  'CASE-03': '일반 프로그램 (개인)_커리큘럼형_단일 회차',
  'CASE-04': '일반 프로그램 (개인)_커리큘럼형_복수 회차',
  'CASE-05': '일반 프로그램 (기관)_일정형_단일 회차',
  'CASE-06': '일반 프로그램 (기관)_일정형_복수 회차',
  'CASE-07': '일반 프로그램 (개인)_일정형_단일 회차',
  'CASE-08': '일반 프로그램 (개인)_일정형_복수 회차',
  'CASE-09':
    '일반 프로그램 (기관)_커리큘럼형_복수 회차 · 교육·IPS 일정별 상이',
} as const

/** FE mock 접두어 변형 (목록에 BE 권장 title이 없을 때 보조) */
export const P0_SEED_TITLE_ALIASES: Partial<Record<keyof typeof P0_SEED_TITLES, readonly string[]>> =
  {
    'CASE-01': ['【유형·7】일반 프로그램 (기관)_커리큘럼형_단일 회차'],
    'CASE-02': ['【유형·8】일반 프로그램 (기관)_커리큘럼형_복수 회차'],
    'CASE-03': ['【유형·9】일반 프로그램 (개인)_커리큘럼형_단일 회차'],
    'CASE-04': ['【유형·10】일반 프로그램 (개인)_커리큘럼형_복수 회차'],
    'CASE-05': ['【유형·11】일반 프로그램 (기관)_일정형_단일 회차'],
    'CASE-06': ['【유형·12】일반 프로그램 (기관)_일정형_복수 회차'],
    'CASE-07': ['【유형·13】일반 프로그램 (개인)_일정형_단일 회차'],
    'CASE-08': ['【유형·14】일반 프로그램 (개인)_일정형_복수 회차'],
    'CASE-09': [
      '【유형·15】일반 프로그램 (기관)_커리큘럼형_복수 회차 · 교육·IPS 일정별 상이',
    ],
  }

/** @deprecated VARIANT_SEED_TITLES — P0 일부. 신규 코드는 P0_SEED_TITLES 사용 */
export const VARIANT_SEED_TITLES = {
  'CASE-01': P0_SEED_TITLES['CASE-01'],
  'CASE-03': P0_SEED_TITLES['CASE-03'],
  'CASE-05': P0_SEED_TITLES['CASE-05'],
} as const

/** P1 — LNB 강사×봉사×설문 매트릭스 (CASE-10~18, FE `formatLnbCaseTitle`과 동일) */
export const P1_SEED_TITLES = {
  'CASE-10': FULL_LNB_DUMMY_TITLE,
  'CASE-11':
    '【LNB·17】강사 있음 · 봉사자 있음(면접 없음) · 설문 있음(하위 4항목)',
  'CASE-12':
    '【LNB·18】강사 없음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 4항목)',
  'CASE-13': '【LNB·19】강사 없음 · 봉사자 있음(면접 없음) · 설문 없음',
  'CASE-14':
    '【LNB·20】강사 없음 · 봉사자 있음(면접 없음) · 설문 있음(하위 1항목)',
  'CASE-15': '【LNB·21】강사 있음 · 봉사자 없음 · 설문 없음',
  'CASE-16': '【LNB·22】강사 없음 · 봉사자 있음(면접 2depth) · 설문 없음',
  'CASE-17': '【LNB·23】강사 있음 · 봉사자 있음(면접 2depth) · 설문 없음',
  'CASE-18':
    '【LNB·24】강사 없음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 1항목)',
} as const

/** P2 — 면접·만족도 대조 (CASE-19~24) */
export const P2_SEED_TITLES = {
  'CASE-19': '【예정·캘린더·B】UJAT 36기',
  'CASE-20': '【진행·캘린더·B】특별한 JOB탐',
  'CASE-21': '【완료·캘린더·B】Global Career Discovery',
  'CASE-22': '【진행·캘린더·C】기관·봉사자 면접 QA',
  'CASE-23': '【완료·캘린더·A】SAP 함께 성장JA',
  'CASE-24': '【진행·캘린더·A】Growth to Professional 2026',
} as const

export type P0SeedCase = keyof typeof P0_SEED_TITLES
export type P1SeedCase = keyof typeof P1_SEED_TITLES
export type P2SeedCase = keyof typeof P2_SEED_TITLES

/** CASE에 대한 검색 title 후보(권장 → alias) */
export function titlesForP0Case(caseId: P0SeedCase): string[] {
  const primary = P0_SEED_TITLES[caseId]
  const aliases = P0_SEED_TITLE_ALIASES[caseId] ?? []
  return [primary, ...aliases]
}
