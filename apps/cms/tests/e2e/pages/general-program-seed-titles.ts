/**
 * 일반 프로그램 E2E — BE 시드 title 상수
 *
 * `[수정 가능] 일반 프로그램 더미` 와 CASE title을 같게 만들거나 덮어쓰지 마세요.
 * @see apps/cms/docs/api/general-program-dummy-seed-backend-request.md
 */

/** 수정 E2E 전용 공유 더미 (대표명 국문은 변경하지 않음) */
export const EDITABLE_DUMMY_TITLE = '[수정 가능] 일반 프로그램 더미'

/** CASE-10 — LNB full (강사·봉사 면접 2depth·설문 full). 상세 smoke 권장 시드 */
export const FULL_LNB_DUMMY_TITLE = '【LNB】강사O · 봉사면접2depth · 설문full'

/** P0 variant 매트릭스 (시드 존재 시 variant smoke) */
export const VARIANT_SEED_TITLES = {
  'CASE-01': '일반 프로그램 (기관)_커리큘럼형_단일 회차',
  'CASE-03': '일반 프로그램 (개인)_커리큘럼형_단일 회차',
  'CASE-05': '일반 프로그램 (기관)_일정형_단일 회차',
} as const
