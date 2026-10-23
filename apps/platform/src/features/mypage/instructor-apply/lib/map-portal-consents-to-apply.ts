import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import {
  INSTRUCTOR_APPLY_CONSENT_KEYS,
  type InstructorApplyConsentKey,
} from '../consent/catalog'
import type { PortalConsentSummary } from '../../settings/api/consents'
import { DOCUMENT_CONSENT_ITEMS, type SettingsConsentItem } from '../../settings/lib/consent-catalog'
import { buildConsentItemsFromSummaries } from '../../settings/lib/map-consents'
import {
  instructorApplyKeyToSettingsConsentItemId,
  settingsConsentItemIdToInstructorKey,
} from '../../settings/lib/settings-consent-key'

const CONSENT_TYPE_TO_APPLY_KEY: Record<string, InstructorApplyConsentKey> = {
  PAYMENT_STATEMENT_PRE_CONSENT: 'consentPaymentStatement',
  PAYMENT_STATEMENT_CONSENT: 'consentPaymentStatement',
  PAYMENT_STATEMENT: 'consentPaymentStatement',
  FACILITATOR_PLEDGE: 'consentEducatorPledge',
  ADMINISTRATIVE_INFO_CONSENT: 'consentAdministrativeJoint',
  CRIMINAL_HISTORY_CHECK_CONSENT: 'consentSexOffenseCheck',
}

export type InstructorApplyPortalConsentState = {
  values: Pick<InstructorSharedProfileFormValues, InstructorApplyConsentKey>
  /** 동의 시각 원문. 표시는 `formatInstructorConsentAgreedAtLabel` */
  agreedAt: Partial<Record<InstructorApplyConsentKey, string>>
}

/** 마이페이지 `GET /api/portal/me/consents` → 강사 신청 4종 동의/미동의·동의 시각 */
export function mapPortalConsentsToInstructorApplyValues(
  summaries: readonly PortalConsentSummary[],
): InstructorApplyPortalConsentState {
  const { documentItems } = buildConsentItemsFromSummaries([...summaries])
  const agreedByKey = new Map<InstructorApplyConsentKey, boolean>()

  for (const item of documentItems) {
    const key = settingsConsentItemIdToInstructorKey(item.id)
    if (key) agreedByKey.set(key, item.agreed)
  }

  const values = Object.fromEntries(
    INSTRUCTOR_APPLY_CONSENT_KEYS.map(key => [
      key,
      agreedByKey.get(key) === true ? CONSENT_VALUE.agree : CONSENT_VALUE.disagree,
    ]),
  ) as Pick<InstructorSharedProfileFormValues, InstructorApplyConsentKey>

  const agreedAt: Partial<Record<InstructorApplyConsentKey, string>> = {}
  for (const summary of summaries) {
    const key = CONSENT_TYPE_TO_APPLY_KEY[summary.consentType?.trim().toUpperCase() ?? '']
    if (!key || values[key] !== CONSENT_VALUE.agree) continue
    const at = summary.agreedAt?.trim()
    if (at) agreedAt[key] = at
  }

  return { values, agreedAt }
}

/** 강사 신청 「동의서 보기」— 제출된 문서 id·제목을 마이페이지 미리보기 항목으로 맞춘다. */
export function mapPortalConsentsToInstructorApplyPreviewItems(
  summaries: readonly PortalConsentSummary[],
): Partial<Record<InstructorApplyConsentKey, SettingsConsentItem>> {
  const { documentItems } = buildConsentItemsFromSummaries([...summaries])
  const result: Partial<Record<InstructorApplyConsentKey, SettingsConsentItem>> = {}
  for (const item of documentItems) {
    const key = settingsConsentItemIdToInstructorKey(item.id)
    if (key && item.agreed) result[key] = item
  }
  return result
}

export function buildInstructorApplyConsentPreviewFallbackItem(
  key: InstructorApplyConsentKey,
  agreedAt?: string,
): SettingsConsentItem {
  const id = instructorApplyKeyToSettingsConsentItemId(key)
  const catalog = DOCUMENT_CONSENT_ITEMS.find(item => item.id === id)
  return {
    id,
    title: catalog?.title ?? '',
    required: catalog?.required ?? false,
    kind: 'document',
    agreed: true,
    agreedAt,
    validityLabel: catalog?.validityLabel,
  }
}
