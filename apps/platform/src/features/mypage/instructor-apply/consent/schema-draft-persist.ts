import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import type { InstructorApplyConsentKey } from './catalog'

const DRAFT_STORAGE_PREFIX = 'platform.instructor-apply.consent-schema-draft.v2.'

export type ConsentSignatureSidecar = {
  mid?: string
  final?: string
}

export type SchemaConsentWriteState = {
  draft: WritingFormDraft
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoValues>
  signatures?: ConsentSignatureSidecar
  /** agreement-crime — CMS와 동일: 업로드 완료 여부 */
  crimeDocumentUploaded?: boolean
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadSchemaConsentWriteState(
  key: InstructorApplyConsentKey,
  fallback: SchemaConsentWriteState
): SchemaConsentWriteState {
  if (!canUseSessionStorage()) return fallback
  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as SchemaConsentWriteState
    if (parsed?.draft == null || typeof parsed.draft !== 'object') return fallback
    return {
      ...fallback,
      ...parsed,
      draft: parsed.draft,
      paymentBasicInfo: { ...fallback.paymentBasicInfo, ...parsed.paymentBasicInfo },
      signatures: { ...fallback.signatures, ...parsed.signatures },
    }
  } catch {
    return fallback
  }
}

export function saveSchemaConsentWriteState(
  key: InstructorApplyConsentKey,
  state: SchemaConsentWriteState
): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${key}`, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}
