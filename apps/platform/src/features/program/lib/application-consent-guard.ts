/**
 * 프로그램 신청 필수 동의 가드 (FE 임시 가드 — BE `REQUIRED_CONSENT_MISSING` 게이트 도입 전).
 *
 * SSOT: GET /api/portal/me/consents (MemberPortalConsentSummary). 서버 값을 그대로 판정하고 mock 은 쓰지 않는다.
 * - 모든 프로그램 신청: PORTRAIT_RIGHTS
 * - UJAT 강사·봉사 신청: FACILITATOR_PLEDGE · CRIMINAL_HISTORY_CHECK_CONSENT · PORTRAIT_RIGHTS
 *   (교육진행자 서약서·성범죄경력 조회 동의서는 강사·UJAT 봉사자 전용 — terms-and-consent-policy.
 *    교사 기관(ORGANIZATION) 신청은 둘 다 요구하지 않고 초상권만 — 2026-11-14 기획 확인)
 *   (ADMINISTRATIVE_INFO_CONSENT 는 2026-10-29 필수 해제 — 마이페이지 작성·조회는 유지)
 * - 서버가 NOT_APPLICABLE(applicable=false) 로 내린 항목(예: 만 14세 미만 성범죄 경력조회)은 건너뛴다.
 * - 이미 동의 완료(만료·재동의·정책 갱신 아님)면 통과.
 * - 조회 실패·행 누락은 막지 않는다(fail-open). 서버 409 가 최종 방어선.
 */

import type { PortalConsentSummary } from '../../mypage/settings/api/consents.ts'
import { buildConsentItemsFromSummaries, SETTINGS_CONSENT_TYPE_BY_ID } from '../../mypage/settings/lib/map-consents.ts'
import { isUjatProgramType } from './portal-category.ts'

export type RequiredApplyConsentType =
  | 'FACILITATOR_PLEDGE'
  | 'ADMINISTRATIVE_INFO_CONSENT'
  | 'CRIMINAL_HISTORY_CHECK_CONSENT'
  | 'PORTRAIT_RIGHTS'

export const PORTRAIT_RIGHTS_CONSENT_TYPE: RequiredApplyConsentType = 'PORTRAIT_RIGHTS'

/** UJAT 3종 — 마이페이지 동의서·서약서 노출 순서와 같게 둔다. 행정정보 공동이용은 선택이라 제외. */
export const UJAT_REQUIRED_APPLY_CONSENT_TYPES: readonly RequiredApplyConsentType[] = [
  'FACILITATOR_PLEDGE',
  'CRIMINAL_HISTORY_CHECK_CONSENT',
  'PORTRAIT_RIGHTS',
]

/** 모달 항목명 — 초상권 문구는 consent-catalog `PORTRAIT_ITEM.title` 과 동일. */
export const REQUIRED_APPLY_CONSENT_LABELS: Record<RequiredApplyConsentType, string> = {
  FACILITATOR_PLEDGE: '교육진행자 서약서',
  ADMINISTRATIVE_INFO_CONSENT: '행정정보 공동이용 동의서',
  CRIMINAL_HISTORY_CHECK_CONSENT: '성범죄경력 조회 동의서',
  PORTRAIT_RIGHTS: '초상권 수집·이용 동의',
}

/** 동의 완료로 볼 수 없는 서버 status */
const BLOCKING_STATUSES = new Set([
  'NOT_AGREED',
  'DISAGREED',
  'EXPIRED',
  'WITHDRAWN',
  'POLICY_UPDATED',
  'SIGNATURE_REQUIRED',
  'REJECTED',
])

/** 교육진행자 서약서·성범죄경력 조회 동의서를 요구하는 신청 유형 — 강사·봉사 신청만 */
const FACILITATOR_APPLICATION_TYPES = new Set(['INSTRUCTOR', 'VOLUNTEER'])

/**
 * @param applicationType 선택한 모집의 신청 유형. 모르면(빈 값) UJAT 3종을 그대로 요구한다.
 */
export function resolveRequiredApplyConsentTypes(input: {
  programType?: string | null
  applicationType?: string | null
}): RequiredApplyConsentType[] {
  if (!isUjatProgramType(input.programType ?? undefined)) return [PORTRAIT_RIGHTS_CONSENT_TYPE]
  const applicationType = normalizeType(input.applicationType ?? undefined)
  if (applicationType && !FACILITATOR_APPLICATION_TYPES.has(applicationType)) {
    return [PORTRAIT_RIGHTS_CONSENT_TYPE]
  }
  return [...UJAT_REQUIRED_APPLY_CONSENT_TYPES]
}

function normalizeType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function isNotApplicable(summary: PortalConsentSummary): boolean {
  return summary.applicable === false || normalizeType(summary.status) === 'NOT_APPLICABLE'
}

/** 한 항목이 신청을 막는지 — 서버 summary 한 행 기준. */
export function isRequiredApplyConsentBlocking(
  type: RequiredApplyConsentType,
  summary: PortalConsentSummary,
  mypageAgreed: boolean,
): boolean {
  if (isNotApplicable(summary)) return false
  if (!mypageAgreed) return true
  if (summary.expired === true) return true
  if (summary.reconsentRequired === true) return true
  if (summary.policyUpdated === true) return true
  if (BLOCKING_STATUSES.has(normalizeType(summary.status))) return true
  if (type === PORTRAIT_RIGHTS_CONSENT_TYPE && summary.programEligible !== true) return true
  return false
}

/**
 * 필수 동의 중 아직 완료되지 않은 항목(입력 순서 유지).
 * 서버 목록에 행이 없으면 판정할 수 없으므로 막지 않는다.
 */
export function findMissingApplyConsents(
  summaries: readonly PortalConsentSummary[],
  required: readonly RequiredApplyConsentType[],
): RequiredApplyConsentType[] {
  // 마이페이지 동의 화면과 같은 '동의 완료' 판정을 써서 CTA 후 무한 차단을 막는다.
  const { basicItems, documentItems } = buildConsentItemsFromSummaries([...summaries])
  const agreedByType = new Map<string, boolean>()
  for (const item of [...basicItems, ...documentItems]) {
    agreedByType.set(SETTINGS_CONSENT_TYPE_BY_ID[item.id], item.agreed)
  }

  const missing: RequiredApplyConsentType[] = []
  for (const type of required) {
    const summary = summaries.find(row => normalizeType(row.consentType) === type)
    if (!summary) continue
    if (isRequiredApplyConsentBlocking(type, summary, agreedByType.get(type) === true)) {
      missing.push(type)
    }
  }
  return missing
}

export function requiredApplyConsentLabels(
  types: readonly RequiredApplyConsentType[],
): string[] {
  return types.map(type => REQUIRED_APPLY_CONSENT_LABELS[type])
}
