import type { FormSignatureValue } from '@/shared/ui/pf-form-signature-block/types'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@jakorea/form-schema/writing-form'
import type { PortalConsentSignatureField } from '../api/portal-consent-documents.types'
import type { ConsentSignatureSidecar } from '../../instructor-apply/consent/schema-draft-persist'

/** 기존 단락 ID → 화면 sidecar. 서버 fieldKey가 이 목록에 없으면 displayOrder로만 매칭한다. */
const FIELD_KEY_TO_SIGNATURE_SLOT: Record<string, 'mid' | 'final'> = {
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature]: 'mid',
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature]: 'final',
  [RECEIPT_PRE_CONSENT_IDS.midSignature]: 'mid',
  [RECEIPT_PRE_CONSENT_IDS.tailSignature]: 'final',
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing]: 'final',
}

export type ConsentSignatureSlot = 'mid' | 'final'

function readSignatureSlot(
  signatures: ConsentSignatureSidecar | undefined,
  slot: ConsentSignatureSlot,
): FormSignatureValue | null {
  const raw = signatures?.[slot]
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw ? { dataUrl: raw, signedAt: new Date().toISOString() } : null
  }
  return raw.dataUrl ? raw : null
}

function signatureKey(signature: FormSignatureValue): string {
  return signature.dataUrl
}

/**
 * 서버 `signatureFields` 순서·fieldKey만 사용한다. 없는 fieldKey를 만들지 않는다.
 * 알려진 단락 ID는 sidecar 슬롯에 붙이고, 그 외는 displayOrder대로 남은 서명 값을 쓴다.
 */
export function resolveConsentSignatureValuesForServerFields(
  fields: PortalConsentSignatureField[] | undefined,
  signatures: ConsentSignatureSidecar | undefined,
  options?: { fallbackSlot?: ConsentSignatureSlot },
): Array<{ fieldKey: string; required: boolean; signature: FormSignatureValue | null }> {
  const sorted = [...(fields ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  const unused: FormSignatureValue[] = []
  const mid = readSignatureSlot(signatures, 'mid')
  const final = readSignatureSlot(signatures, 'final')
  if (mid) unused.push(mid)
  if (final && (!mid || signatureKey(final) !== signatureKey(mid))) unused.push(final)

  const used = new Set<string>()
  const takeUnused = (): FormSignatureValue | null => {
    while (unused.length > 0) {
      const next = unused.shift()
      if (next == null) return null
      const key = signatureKey(next)
      if (used.has(key)) continue
      used.add(key)
      return next
    }
    return null
  }

  return sorted.flatMap(field => {
    const fieldKey = field.fieldKey?.trim()
    if (!fieldKey || field.signed === true) return []
    const slot = FIELD_KEY_TO_SIGNATURE_SLOT[fieldKey]
    const mapped = slot ? readSignatureSlot(signatures, slot) : null
    let signature = mapped
    if (signature) {
      used.add(signatureKey(signature))
    } else {
      signature = takeUnused()
    }
    if (!signature && field.required === true && options?.fallbackSlot) {
      signature = readSignatureSlot(signatures, options.fallbackSlot)
      if (signature) used.add(signatureKey(signature))
    }
    return [{ fieldKey, required: field.required === true, signature }]
  })
}
