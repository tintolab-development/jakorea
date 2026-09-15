/**
 * mock → 실 API 전환 게이트
 *
 * `VITE_API_BASE_URL` / `VITE_API_SERVER` 등으로 백엔드가 설정돼 있으면
 * **전 모듈 실 API**. 부분 mock 모듈 allowlist는 사용하지 않는다.
 *
 * 도메인 식별용 `RealApiModule` 키는 호출부·backend-dummies 칩용으로만 유지한다.
 */

import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** 실 API 연동 단위 — 도메인 식별·디버그 UI용 */
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
  'files',
] as const
export type RealApiModule = (typeof REAL_API_MODULE_KEYS)[number]

/**
 * 백엔드 URL이 준비돼 있으면 true (전 모듈 동일).
 * `_module`은 호출부 호환용이며 게이트에 사용하지 않는다.
 */
export function isRealApiModuleEnabled(_module: RealApiModule): boolean {
  return isRemoteApiConfigured()
}
