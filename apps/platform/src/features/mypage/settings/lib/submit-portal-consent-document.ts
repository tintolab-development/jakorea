import { resolveInstructorApplyConsentTemplate } from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { buildPortraitFilledDocument } from '@/features/auth/sign-up/lib/map-portrait-consent-filled-document'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { uploadMemberPortalFile } from '../../instructor-apply/api/member-file-upload'
import type { InstructorApplyConsentKey } from '../../instructor-apply/consent/catalog'
import type { SchemaConsentWriteState } from '../../instructor-apply/consent/schema-draft-persist'
import {
  completePortalConsentDocument,
  createPortalConsentDocument,
  fetchPortalConsentDocumentDetail,
  putPortalSignatureCurrent,
  signPortalConsentDocumentField,
} from '../api/portal-consent-documents'
import { PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY } from './settings-consent-key'
import type { FormSignatureValue } from '@/shared/ui/pf-form-signature-block/types'
import { buildPortalPortraitRightsConsentCreateRequest } from './portal-portrait-consent-create-request'
import { resolvePortraitPortalCompleteHints } from './resolve-portrait-portal-complete'

const SIGNATURE_FILE_PURPOSE = 'MEMBER_ELECTRONIC_SIGNATURE'

const FIELD_KEY_TO_SIGNATURE_SLOT: Record<string, 'mid' | 'final'> = {
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature]: 'mid',
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature]: 'final',
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature]: 'final',
}

export type PortraitPortalConsentWriteState = {
  draft: WritingFormDraft
  signatures?: SchemaConsentWriteState['signatures']
}

async function dataUrlToPngFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], 'electronic-signature.png', { type: blob.type || 'image/png' })
}

function resolveSignatureType(mode?: FormSignatureValue['mode']): string {
  return mode === 'create' ? 'TYPED' : 'DRAWN'
}

async function registerSignatureProfile(signature: FormSignatureValue): Promise<number> {
  const file = await dataUrlToPngFile(signature.dataUrl)
  const fileObjectId = await uploadMemberPortalFile({
    file,
    filePurpose: SIGNATURE_FILE_PURPOSE,
  })
  const profile = await putPortalSignatureCurrent({
    signatureType: resolveSignatureType(signature.mode),
    fileObjectId,
    displayName: signature.displayName,
    fontStyleCode: signature.fontStyleCode,
  })
  if (profile.signatureProfileId == null) {
    throw new Error('전자서명을 등록하지 못했습니다.')
  }
  return profile.signatureProfileId
}

function resolveSignatureForFieldKey(
  fieldKey: string,
  signatures: SchemaConsentWriteState['signatures'],
): FormSignatureValue | null {
  const slot = FIELD_KEY_TO_SIGNATURE_SLOT[fieldKey]
  if (!slot) return null
  const raw = signatures?.[slot]
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw ? { dataUrl: raw, signedAt: new Date().toISOString() } : null
  }
  return raw.dataUrl ? raw : null
}

async function signDocumentSignatureFields(
  documentId: number,
  state: SchemaConsentWriteState,
): Promise<void> {
  let detail = await fetchPortalConsentDocumentDetail(documentId)
  const fields = [...(detail.signatureFields ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )

  for (const field of fields) {
    const fieldKey = field.fieldKey?.trim()
    if (!fieldKey || field.signed === true) continue
    const signature = resolveSignatureForFieldKey(fieldKey, state.signatures)
    if (!signature) {
      if (field.required) {
        throw new Error('필수 전자서명이 누락되었습니다.')
      }
      continue
    }
    const signatureProfileId = await registerSignatureProfile(signature)
    detail = await signPortalConsentDocumentField(documentId, fieldKey, {
      signatureProfileId,
    })
  }
}

function buildFilledDocument(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState,
): { templateCode: string; schemaJson: WritingFormDraft; paymentBasicInfo?: Record<string, unknown> } {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  return {
    templateCode: templateId,
    schemaJson: state.draft,
    ...(state.paymentBasicInfo ? { paymentBasicInfo: state.paymentBasicInfo } : {}),
  }
}

/** 마이페이지 설정 — Portal document create → sign fields → complete */
export async function submitPortalConsentDocumentFromWriteState(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState,
): Promise<void> {
  const consentType = PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY[consentKey]
  const created = await createPortalConsentDocument({ consentType })
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }

  await signDocumentSignatureFields(documentId, state)

  const filledDocument = buildFilledDocument(consentKey, state)
  await completePortalConsentDocument(documentId, {
    filledDocument: {
      ...filledDocument,
      schemaJson: filledDocument.schemaJson as unknown as Record<string, unknown>,
    },
  })
}

/** 마이페이지 — 초상권 수집·이용 동의서 */
export async function submitPortalPortraitConsentFromWriteState(
  state: PortraitPortalConsentWriteState,
  options?: { memberId?: number },
): Promise<void> {
  const createBody = await buildPortalPortraitRightsConsentCreateRequest(options?.memberId)
  const created = await createPortalConsentDocument(createBody)
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }

  await signDocumentSignatureFields(documentId, state)

  const filledDocument = buildPortraitFilledDocument(state.draft)
  const hints = resolvePortraitPortalCompleteHints(state.draft)

  await completePortalConsentDocument(documentId, {
    filledDocument: {
      templateCode: filledDocument.templateCode,
      schemaJson: filledDocument.schemaJson as unknown as Record<string, unknown>,
    },
    consentStatus: hints.consentStatus,
    programEligible: hints.programEligible,
  })
}

/** 성범죄 — schema 작성 없이 complete만 (증빙 filePurpose 업로드는 별도 정책) */
export async function submitPortalCrimeConsentComplete(
  consentKey: InstructorApplyConsentKey,
): Promise<void> {
  const consentType = PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY[consentKey]
  const created = await createPortalConsentDocument({ consentType })
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }
  await completePortalConsentDocument(documentId, {})
}
