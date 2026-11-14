import { isUnder14FromAgeGroup, parsePortalAgeGroup } from '@/features/auth/sign-in/lib/portal-age-group'
import type { PlatformMemberProfile } from '../../model/types.ts'
import {
  DOCUMENT_CONSENT_ITEMS,
  type BasicConsentAudience,
  type SettingsConsentItem,
  type SettingsConsentItemId,
} from './consent-catalog.ts'
import { SETTINGS_CONSENT_TYPE_BY_ID } from './map-consents.ts'
import { ensurePinnedPaymentStatementConsentItem } from './payment-statement-consent-status.ts'

/** 교사(비겸직) · 교사 겸직 강사 — 교사 전용 약관 노출 */
export function isTeacherSettingsProfile(profile: PlatformMemberProfile): boolean {
  return profile === 'school_teacher' || profile === 'instructor_dual'
}

export function isUnder14FromBirthDate(birthDate: string | undefined, now = new Date()): boolean {
  const matched = birthDate?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return false

  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  const fourteenthBirthday = new Date(year + 14, month - 1, day)
  return now < fourteenthBirthday
}

/** `ageGroup === "UNDER_14"` 정본. 없으면 profile `under14` → 생년월일. 누락 ageGroup을 성인으로 보지 않음. */
export function isMinorSettingsMember(input: {
  under14?: boolean
  ageGroup?: string
  birthDate?: string
}): boolean {
  const ageGroup = parsePortalAgeGroup(input.ageGroup)
  if (ageGroup) {
    const isUnder14 = isUnder14FromAgeGroup(ageGroup)
    return isUnder14
  }
  if (input.under14 === true) return true
  return isUnder14FromBirthDate(input.birthDate)
}

/** 교사·미성년 전용 기본 동의 — `getBasicConsentItems`와 동일 노출 규칙 */
export function filterBasicConsentItemsByAudience(
  items: SettingsConsentItem[],
  audience: BasicConsentAudience,
): SettingsConsentItem[] {
  return items.filter(item => {
    if (item.id === 'privacyCollection') return !audience.isMinor
    if (item.id === 'teacherInfo') return audience.isTeacher
    if (item.id === 'guardianLegal' || item.id === 'childPrivacy') return audience.isMinor
    return true
  })
}

/**
 * 마이페이지 「동의서·서약서」 카드 노출 — 기본 미노출, 서버 `listed === true`만 노출.
 * `listed`는 BE가 카드 노출 고정(작성 완료 시 DB 트리거·POST /consents/listed)으로 기록한 값이며
 * 동의 효력과는 무관하다. 원격 세션이 아니면(mock) 기존처럼 카탈로그를 그대로 둔다.
 */
/**
 * 동의 관리 「동의서·서약서」 카드 노출.
 * - 원격: 서버 `listed === true`인 카드만 (기본 미노출)
 * - 지급조서 사전 동의서: 강사 회원(`instructor_only`·`instructor_dual`)만
 * 정산·신청 게이트 판정용 `documentItems`에는 적용하지 않는다 (화면 노출 전용).
 */
const INSTRUCTOR_EDUCATOR_DOCUMENT_IDS: ReadonlySet<SettingsConsentItemId> = new Set([
  'educatorPledge',
  'administrativeJoint',
  'sexOffenseCheck',
])

/** 강사 회원 — 이용 가이드 4종 동의서·서약서가 목록에 빠지지 않도록 카탈로그 행을 보강한다. */
export function ensureInstructorDocumentConsentItems(
  documentItems: readonly SettingsConsentItem[],
  isInstructor: boolean,
): SettingsConsentItem[] {
  const withPayment = ensurePinnedPaymentStatementConsentItem(documentItems)
  if (!isInstructor) return withPayment

  const merged = [...withPayment]
  const seen = new Set(merged.map(item => item.id))
  for (const id of INSTRUCTOR_EDUCATOR_DOCUMENT_IDS) {
    if (seen.has(id)) continue
    const catalog = DOCUMENT_CONSENT_ITEMS.find(item => item.id === id)
    if (!catalog) continue
    merged.push({ ...catalog, listed: true })
    seen.add(id)
  }
  return merged
}

/**
 * 프로그램 신청 필수 동의 게이트 → 동의 관리 이동 시 빠진 항목(서버 consentType, 쉼표 구분).
 * 예: `?tab=consents&required=FACILITATOR_PLEDGE,CRIMINAL_HISTORY_CHECK_CONSENT`
 */
export const APPLY_GATE_REQUIRED_CONSENTS_PARAM = 'required'

const SETTINGS_CONSENT_ID_BY_TYPE = new Map<string, SettingsConsentItemId>(
  (Object.entries(SETTINGS_CONSENT_TYPE_BY_ID) as [SettingsConsentItemId, string][]).map(
    ([id, type]) => [type, id],
  ),
)

/** `required` 쿼리 값 → 동의서·서약서 카드 id. 모르는 값은 버린다. */
export function parseApplyGateRequiredConsentItemIds(
  raw: string | null | undefined,
): ReadonlySet<SettingsConsentItemId> {
  const ids = new Set<SettingsConsentItemId>()
  for (const token of (raw ?? '').split(',')) {
    const id = SETTINGS_CONSENT_ID_BY_TYPE.get(token.trim().toUpperCase())
    if (id) ids.add(id)
  }
  return ids
}

/**
 * 신청 게이트가 요구한 동의서·서약서가 목록 데이터에 없으면 카탈로그 행을 보강한다.
 * (작성 전 비강사 회원 — 서버 요약 행이 빠진 경우에도 작성 진입 카드가 있어야 한다.)
 */
export function ensureApplyGateRequiredDocumentConsentItems(
  documentItems: readonly SettingsConsentItem[],
  requiredIds: ReadonlySet<SettingsConsentItemId>,
): SettingsConsentItem[] {
  const merged = [...documentItems]
  if (requiredIds.size === 0) return merged
  const seen = new Set(merged.map(item => item.id))
  for (const id of requiredIds) {
    if (seen.has(id)) continue
    const catalog = DOCUMENT_CONSENT_ITEMS.find(item => item.id === id)
    if (!catalog) continue
    merged.push({ ...catalog })
    seen.add(id)
  }
  return merged
}

/**
 * @param options.requiredIds 신청 게이트에서 넘어온 빠진 항목 — 작성 전(`listed` 아님)이어도 카드를 보여준다.
 *   (QA-02: 비강사 UJAT 봉사자가 [서약 및 동의하기]로 왔는데 작성할 카드가 없던 문제, 2026-11-14)
 */
export function filterListedDocumentConsentItems(
  items: SettingsConsentItem[],
  options: {
    isRemoteSession: boolean
    isInstructor: boolean
    requiredIds?: ReadonlySet<SettingsConsentItemId>
  },
): SettingsConsentItem[] {
  return items.filter(item => {
    if (item.id === 'paymentStatement' && !options.isInstructor) return false
    if (options.requiredIds?.has(item.id as SettingsConsentItemId)) return true
    if (
      options.isInstructor &&
      INSTRUCTOR_EDUCATOR_DOCUMENT_IDS.has(item.id as SettingsConsentItemId)
    ) {
      return true
    }
    return !options.isRemoteSession || item.listed === true
  })
}
