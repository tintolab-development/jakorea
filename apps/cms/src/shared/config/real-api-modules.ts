/**
 * 점진적 mock → 실 API 전환
 *
 * `VITE_API_BASE_URL` / `VITE_API_SERVER` 등으로 백엔드가 설정돼 있어도,
 * `VITE_REAL_API_MODULES`에 **나열된 모듈만** 실 API를 탄다 (존재·검증된 엔드포인트부터 키를 추가).
 *
 * - **목록 미설정(환경변수 없음·빈 문자열)** : 원격 URL이 있어도 **전부 mock** (관리자 이메일 로그인 포함 — MFA mock 플로우 유지).
 * - **목록 설정** : 예 `adminAuth,textbooks` — 쉼표로 구분한 키만 실 API, 나머지는 mock.
 *
 * 새 도메인을 실 API로 붙일 때: 아래 `RealApiModule` 유니온에 키를 추가하고, 해당 서비스에서 `isRealApiModuleEnabled(...)` 호출.
 */

import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** 실 API 연동 단위 — 필요 시 문자열 하나씩 추가 */
export const REAL_API_MODULE_KEYS = [
  'adminAuth',
  'dashboard',
  'logs',
  'detailedPrograms',
  'textbooks',
  'sponsors',
  'notices',
  'faqs',
  'inquiries',
  'paymentOrders',
  'accountPayments',
  'settlementConfigs',
  'members',
  'instructorRoleRequests',
  'adminApprovalRequests',
  'adminPermissions',
  'identityVerification',
  'socialAuth',
  'socialAuthLogin',
  'findEmail',
  'findPassword',
  'notifications',
  'performanceRecords',
  'formsSurveys',
  'programs',
  'ujatPrograms',
  'ujatEducationRegions',
  'trainedTeacherPrograms',
  'geminiVisitingTraining',
  'geminiPerformance',
  'applications',
  'programProgress',
] as const
export type RealApiModule = (typeof REAL_API_MODULE_KEYS)[number]

function explicitModuleSet(): Set<string> | null {
  const raw = import.meta.env.VITE_REAL_API_MODULES
  if (raw === undefined) return null
  const trimmed = String(raw).trim()
  if (trimmed === '') return null

  const set = new Set(
    trimmed
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
  return set
}

/**
 * 백엔드 URL이 준비돼 있고, 해당 모듈이 목록에 포함될 때만 true.
 */
export function isRealApiModuleEnabled(module: RealApiModule): boolean {
  if (!isRemoteApiConfigured()) return false

  const explicit = explicitModuleSet()
  if (explicit === null) {
    return false
  }

  return explicit.has(module)
}
