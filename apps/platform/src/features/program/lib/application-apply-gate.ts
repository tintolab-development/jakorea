/**
 * 프로그램 신청 진입(application-options) 시 모달 분기.
 *
 * SSOT: GET /api/portal/programs/{programId}/application-options
 * `blockedReason` — HomepageProgramQueryService#blockedReason (Java enum 없음, 문자열 리터럴)
 *
 * 연간 참여 동의 3종(FACILITATOR_PLEDGE 등)은 options에 없음 — 배정 단계 409 / GET /me/consents.
 * `required-consent` 모달은 options 게이트에서 쓰지 않는다.
 */

import type { PortalApplicationBlockedReason } from '../api/application-types'

export type ProgramApplyGateModalKind = 'not-eligible' | 'already-applied'

/** Figma 「신청 대상이 아닙니다」 — 모집 대상·회원 유형·소속·강사 승인 */
const NOT_ELIGIBLE_BLOCKED_REASONS = new Set<PortalApplicationBlockedReason>([
  'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH',
  'COLLEGE_STUDENT_REQUIRED',
  'ORGANIZATION_MEMBERSHIP_REQUIRED',
  'APPROVED_INSTRUCTOR_REQUIRED',
  'MEMBER_NOT_ACTIVE',
  'APPLICATION_TYPE_NOT_ALLOWED',
])

/** canApply=false 이어도 신청서 화면 진입(양식·배너) 허용 */
const PROCEED_TO_APPLY_PAGE_REASONS = new Set<PortalApplicationBlockedReason>([
  'PROGRAM_NOT_APPLICABLE',
  'RECRUITMENT_NOT_STARTED',
  'RECRUITMENT_CLOSED',
  'APPLICATION_FORM_NOT_CONFIGURED',
  'CAPACITY_FULL',
])

export function normalizePortalApplicationBlockedReason(
  reason: string | null | undefined,
): PortalApplicationBlockedReason | null {
  if (!reason?.trim()) return null
  return reason.trim().toUpperCase() as PortalApplicationBlockedReason
}

const ALL_PORTAL_APPLICATION_BLOCKED_REASONS = new Set<PortalApplicationBlockedReason>([
  ...NOT_ELIGIBLE_BLOCKED_REASONS,
  ...PROCEED_TO_APPLY_PAGE_REASONS,
  'ALREADY_APPLIED',
])

export function isPortalApplicationBlockedReason(
  value: string,
): value is PortalApplicationBlockedReason {
  const key = value.trim().toUpperCase()
  return ALL_PORTAL_APPLICATION_BLOCKED_REASONS.has(key as PortalApplicationBlockedReason)
}

/**
 * 상세·신청 진입 게이트.
 * - `proceed`: 신청서 라우트로 이동 (모집 전/마감·정원·양식 미설정 등은 신청서 배너)
 * - `not-eligible` | `already-applied`: 모달, 이동 없음
 */
export function resolveProgramApplyGateModal(
  canApply: boolean | undefined,
  blockedReason: string | null | undefined,
): ProgramApplyGateModalKind | 'proceed' {
  if (canApply !== false) return 'proceed'
  const key = normalizePortalApplicationBlockedReason(blockedReason)
  if (!key) return 'proceed'
  if (key === 'ALREADY_APPLIED') return 'already-applied'
  if (NOT_ELIGIBLE_BLOCKED_REASONS.has(key)) return 'not-eligible'
  if (PROCEED_TO_APPLY_PAGE_REASONS.has(key)) return 'proceed'
  return 'proceed'
}

/** options 배너 대신 모달로 처리하는 사유 — 신청서 상단 blockedMessage 숨김 */
export function shouldHideApplyPageBlockedBanner(
  canApply: boolean | undefined,
  blockedReason: string | null | undefined,
): boolean {
  const modal = resolveProgramApplyGateModal(canApply, blockedReason)
  return modal !== 'proceed'
}
