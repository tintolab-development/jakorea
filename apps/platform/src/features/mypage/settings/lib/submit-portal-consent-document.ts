import { resolveInstructorApplyConsentTemplate } from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { buildPortraitFilledDocument } from '@/features/auth/sign-up/lib/map-portrait-consent-filled-document'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { isAxiosError } from 'axios'
import {
  fetchMemberPortalFile,
  uploadMemberPortalFile,
} from '../../instructor-apply/api/member-file-upload'
import type { InstructorApplyConsentKey } from '../../instructor-apply/consent/catalog'
import { readCrimeConsentErrorCodeFromBody } from '../../instructor-apply/consent/crime-consent-original'
import {
  submitCrimeConsentOriginal,
  type CrimeConsentApiFailure,
  type CrimeConsentSubmitSession,
} from '../../instructor-apply/consent/crime-consent-submit'
import type { SchemaConsentWriteState } from '../../instructor-apply/consent/schema-draft-persist'
import {
  completePortalConsentDocument,
  createPortalConsentDocument,
  fetchPortalConsentDocumentDetail,
  putPortalSignatureCurrent,
  signPortalConsentDocumentField,
} from '../api/portal-consent-documents'
import { buildPortalSignatureProfileRequest } from './portal-signature-profile'
import { PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY } from './settings-consent-key'
import type { FormSignatureValue } from '@/shared/ui/pf-form-signature-block/types'
import { buildPortalPortraitRightsConsentCreateRequest } from './portal-portrait-consent-create-request'
import { resolvePortraitPortalCompleteHints } from './resolve-portrait-portal-complete'

/** OpenAPI: ELECTRONIC_SIGNATURE가 저장 정본. MEMBER_ELECTRONIC_SIGNATURE는 동등 alias. */
const SIGNATURE_FILE_PURPOSE = 'ELECTRONIC_SIGNATURE'

const FIELD_KEY_TO_SIGNATURE_SLOT: Record<string, 'mid' | 'final'> = {
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature]: 'mid',
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature]: 'final',
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature]: 'final',
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature]: 'final',
  /** 화면 서명은 확인 문구 단락에 그리고, 값은 signatures.final에 둔다. */
  [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing]: 'final',
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

async function registerSignatureProfile(signature: FormSignatureValue): Promise<number> {
  const file = await dataUrlToPngFile(signature.dataUrl)
  const fileObjectId = await uploadMemberPortalFile({
    file,
    filePurpose: SIGNATURE_FILE_PURPOSE,
  })
  const profile = await putPortalSignatureCurrent(
    buildPortalSignatureProfileRequest(fileObjectId),
  )
  if (profile.signatureProfileId == null) {
    throw new Error('전자서명을 등록하지 못했습니다.')
  }
  return profile.signatureProfileId
}

function readSignatureSlot(
  signatures: SchemaConsentWriteState['signatures'],
  slot: 'mid' | 'final',
): FormSignatureValue | null {
  const raw = signatures?.[slot]
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw ? { dataUrl: raw, signedAt: new Date().toISOString() } : null
  }
  return raw.dataUrl ? raw : null
}

function resolveSignatureForFieldKey(
  fieldKey: string,
  signatures: SchemaConsentWriteState['signatures'],
): FormSignatureValue | null {
  const slot = FIELD_KEY_TO_SIGNATURE_SLOT[fieldKey]
  if (!slot) return null
  return readSignatureSlot(signatures, slot)
}

async function signDocumentSignatureFields(
  documentId: number,
  state: SchemaConsentWriteState,
  options?: { fallbackSlot?: 'mid' | 'final' },
): Promise<void> {
  let detail = await fetchPortalConsentDocumentDetail(documentId)
  const fields = [...(detail.signatureFields ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )

  for (const field of fields) {
    const fieldKey = field.fieldKey?.trim()
    if (!fieldKey || field.signed === true) continue
    const signature =
      resolveSignatureForFieldKey(fieldKey, state.signatures) ??
      (field.required && options?.fallbackSlot
        ? readSignatureSlot(state.signatures, options.fallbackSlot)
        : null)
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

export function buildPortalConsentFilledDocument(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState,
): {
  templateVersionId?: number | null
  templateCode: string
  schemaJson: WritingFormDraft
  paymentBasicInfo?: Record<string, unknown>
} {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  return {
    templateVersionId: state.portalDocument?.templateVersionId,
    templateCode: state.portalDocument?.templateCode?.trim() || templateId,
    schemaJson: state.draft,
    ...(state.paymentBasicInfo ? { paymentBasicInfo: state.paymentBasicInfo } : {}),
  }
}

async function resolveDocumentForSubmit(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState,
): Promise<{ documentId: number; templateVersionId?: number | null; templateCode?: string | null }> {
  if (state.portalDocument?.documentId != null) {
    return state.portalDocument
  }
  const consentType = PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY[consentKey]
  const created = await createPortalConsentDocument({ consentType })
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }
  return {
    documentId,
    templateVersionId: created.formTemplateVersion?.templateVersionId ?? null,
    templateCode: created.formTemplateVersion?.templateCode ?? null,
  }
}

/** 마이페이지 설정 — Portal document create → sign fields → complete */
export async function submitPortalConsentDocumentFromWriteState(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState,
): Promise<void> {
  const portalDocument = await resolveDocumentForSubmit(consentKey, state)
  const documentId = portalDocument.documentId

  await signDocumentSignatureFields(documentId, state)

  const filledDocument = buildPortalConsentFilledDocument(consentKey, {
    ...state,
    portalDocument: {
      ...portalDocument,
      templateCode: portalDocument.templateCode ?? undefined,
    },
  })
  await completePortalConsentDocument(documentId, {
    filledDocument: {
      ...filledDocument,
      schemaJson: filledDocument.schemaJson as unknown as Record<string, unknown>,
    },
  })
}

/** 마이페이지 — 초상권 수집·이용 동의서 (미성년 프로그램 신청 시 `programTarget`) */
export async function submitPortalPortraitConsentFromWriteState(
  state: PortraitPortalConsentWriteState,
  options?: {
    programTarget?: { programId: number }
    /** 만 14세 미만 complete 필수. 화면·로그에 출력하지 않는다. */
    guardianVerificationToken?: string
  },
): Promise<void> {
  const programTarget = options?.programTarget
  const guardianVerificationToken = options?.guardianVerificationToken?.trim()
  const createBody = buildPortalPortraitRightsConsentCreateRequest(
    programTarget ? { programId: programTarget.programId } : undefined,
  )
  const created = await createPortalConsentDocument(createBody)
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }

  await signDocumentSignatureFields(documentId, state, { fallbackSlot: 'final' })

  const filledDocument = buildPortraitFilledDocument(state.draft)
  const hints = resolvePortraitPortalCompleteHints(state.draft)

  await completePortalConsentDocument(documentId, {
    filledDocument: {
      templateVersionId: created.formTemplateVersion?.templateVersionId ?? null,
      templateCode:
        created.formTemplateVersion?.templateCode?.trim() || filledDocument.templateCode,
      schemaJson: filledDocument.schemaJson as unknown as Record<string, unknown>,
    },
    consentStatus: hints.consentStatus,
    programEligible: hints.programEligible,
    ...(guardianVerificationToken ? { guardianVerificationToken } : {}),
  })
}

function readCrimeConsentApiFailure(error: unknown): CrimeConsentApiFailure | null {
  if (!isAxiosError(error) || error.response == null) return null
  return {
    status: error.response.status,
    code: readCrimeConsentErrorCodeFromBody(error.response.data),
  }
}

/**
 * 성범죄 — 원본 PDF(`CRIMINAL_HISTORY_CONSENT_ORIGINAL`)를 문서에 연결해 complete.
 * 제출 직전 GET /me/files/{id} 재확인·응답 유실 재전송·409 처리는 `submitCrimeConsentOriginal`.
 * `session`은 호출 화면이 메모리에 보관한다.
 */
export async function submitPortalCrimeConsentComplete(
  consentKey: InstructorApplyConsentKey,
  input: { evidenceFileObjectId: number; session: CrimeConsentSubmitSession },
): Promise<void> {
  const consentType = PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY[consentKey]
  await submitCrimeConsentOriginal(
    {
      fetchFile: fileObjectId => fetchMemberPortalFile(fileObjectId),
      createDocument: () => createPortalConsentDocument({ consentType }),
      completeDocument: (documentId, body) => completePortalConsentDocument(documentId, body),
      fetchDocument: documentId => fetchPortalConsentDocumentDetail(documentId),
      readApiFailure: readCrimeConsentApiFailure,
      reportClientBug: code => {
        console.error('crimeConsent complete rejected request body', { code, consentType })
      },
    },
    input.session,
    input.evidenceFileObjectId,
  )
}
