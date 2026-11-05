import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import type { FormSignatureValue } from '@/shared/ui'
import type { DocumentConsentWriteKey } from './catalog'

const DRAFT_STORAGE_PREFIX = 'platform.instructor-apply.consent-schema-draft.v2.'

export type ConsentSignatureSidecar = {
  mid?: string | FormSignatureValue
  final?: string | FormSignatureValue
}

export type SchemaConsentWriteState = {
  draft: WritingFormDraft
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoValues>
  signatures?: ConsentSignatureSidecar
  portalDocument?: {
    documentId: number
    templateVersionId?: number | null
    templateCode?: string | null
  }
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadSchemaConsentWriteState(
  key: DocumentConsentWriteKey,
  fallback: SchemaConsentWriteState
): SchemaConsentWriteState {
  if (!canUseSessionStorage()) return fallback
  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`)
    if (!raw) return fallback
    const stored = JSON.parse(raw) as SchemaConsentWriteState & Record<string, unknown>
    if (stored?.draft == null || typeof stored.draft !== 'object') return fallback
    // 성범죄 원본 업로드 상태는 화면 세션에만 둔다. 예전 session 값은 복원하지 않는다.
    const { crimeDocumentUploaded: _legacyCrimeUploaded, ...parsed } = stored
    void _legacyCrimeUploaded
    return {
      ...fallback,
      ...parsed,
      draft: parsed.draft,
      paymentBasicInfo: { ...fallback.paymentBasicInfo, ...parsed.paymentBasicInfo },
      signatures: { ...fallback.signatures, ...parsed.signatures },
      portalDocument: parsed.portalDocument ?? fallback.portalDocument,
    }
  } catch {
    return fallback
  }
}

export function saveSchemaConsentWriteState(
  key: DocumentConsentWriteKey,
  state: SchemaConsentWriteState
): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${key}`, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

/** 양식 작성 화면 재진입 시 이전 session draft(서명·입력 포함) 제거 */
export function clearSchemaConsentWriteState(key: DocumentConsentWriteKey): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${key}`)
  } catch {
    /* ignore */
  }
}
