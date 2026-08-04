/**
 * Gemini 프로그램 E2E — BE/FE 시드 title 상수
 *
 * 일반·1사1교·UJAT·교육받은 교사 title과 충돌·덮어쓰기 금지.
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md
 */

/** 찾아가는 연수 — 모집 공고 P0 featured (BE 권장) */
export const GEMINI_VISITING_FEATURED_TITLE =
  '[Gemini더미] Coding Bootcamp (예정)' as const

/** FE mock 모집 title (gate OFF / mock 목록) */
export const GEMINI_VISITING_FE_MOCK_IN_PROGRESS_TITLE =
  '(Google for Education & JA Korea) Gemini Academy 2025 찾아가는 연수 신청' as const

export const GEMINI_VISITING_FE_MOCK_BOOTCAMP_TITLE =
  '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp' as const

/** 찾아가는 연수 — 모집 공고 검색 후보 (BE → FE mock) */
export const GEMINI_VISITING_FEATURED_CANDIDATES = [
  GEMINI_VISITING_FEATURED_TITLE,
  '[Gemini더미] Gemini Academy 2025 찾아가는 연수 신청',
  '[Gemini더미] Coding Bootcamp',
  GEMINI_VISITING_FE_MOCK_IN_PROGRESS_TITLE,
  GEMINI_VISITING_FE_MOCK_BOOTCAMP_TITLE,
] as const

/** 승인 연수 목록 — 기관명 후보 (GVT-A-*) */
export const GEMINI_APPROVED_INSTITUTION_CANDIDATES = [
  '강서초등학교',
  '푸른솔초등학교',
  '하늘빛초등학교',
  '새싹초등학교',
] as const

/** 실적 관리 — GPERF-01 강사명 (목록 행 식별) */
export const GEMINI_PERFORMANCE_FEATURED_TEXT = '홍길동' as const

/** 실적 관리 — 강사 필터 후보 (GPERF-01~05) */
export const GEMINI_PERFORMANCE_INSTRUCTOR_CANDIDATES = [
  GEMINI_PERFORMANCE_FEATURED_TEXT,
  '김민수',
  '이영희',
  '박민지',
  '최지우',
] as const

/** 실적 관리 — 연수장소 필터 후보 */
export const GEMINI_PERFORMANCE_LOCATION_CANDIDATES = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
] as const
