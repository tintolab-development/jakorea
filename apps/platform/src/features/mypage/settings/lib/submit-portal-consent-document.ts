import {
  resolveDocumentConsentTemplate,
  toReceiptPreConsentFilledBasicInfo,
} from '@jakorea/form-schema/consent'
import { type WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { buildPortraitFilledDocument } from '@/features/auth/sign-up/lib/map-portrait-consent-filled-document'
import { resolveConsentSignatureValuesForServerFields } from './resolve-consent-signature-field-values'
import { isAxiosError } from 'axios'
import {
  fetchMemberPortalFile,
  uploadMemberPortalFile,
} from '../../instructor-apply/api/member-file-upload'
import type { DocumentConsentWriteKey } from '../../instructor-apply/consent/catalog'
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
import { resolvePortalConsentCreateType } from './settings-consent-key'
import type { FormSignatureValue } from '@/shared/ui/pf-form-signature-block/types'
import type { PortalConsentDocumentDetail } from '../api/portal-consent-documents.types'
import { buildPortalPortraitRightsConsentCreateRequest } from './portal-portrait-consent-create-request'
import { resolvePortraitPortalCompleteHints } from './resolve-portrait-portal-complete'

/** OpenAPI: ELECTRONIC_SIGNATURE가 저장 정본. MEMBER_ELECTRONIC_SIGNATURE는 동등 alias. */
const SIGNATURE_FILE_PURPOSE = 'ELECTRONIC_SIGNATURE'

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

async function signDocumentSignatureFields(
  documentId: number,
  state: SchemaConsentWriteState,
  options?: { fallbackSlot?: 'mid' | 'final' },
): Promise<void> {
  const detail = await fetchPortalConsentDocumentDetail(documentId)
  const pending = resolveConsentSignatureValuesForServerFields(
    detail.signatureFields,
    state.signatures,
    options,
  )

  for (const field of pending) {
    if (!field.signature) {
      if (field.required) {
        throw new Error('필수 전자서명이 누락되었습니다.')
      }
      continue
    }
    const signatureProfileId = await registerSignatureProfile(field.signature)
    await signPortalConsentDocumentField(documentId, field.fieldKey, {
      signatureProfileId,
    })
  }
}

function readCreatedConsentTemplateVersion(created: PortalConsentDocumentDetail): {
  templateVersionId?: number | null
  templateCode?: string | null
} {
  return {
    templateVersionId:
      created.formTemplateVersion?.templateVersionId ??
      created.filledDocument?.templateVersionId ??
      null,
    templateCode:
      created.formTemplateVersion?.templateCode ?? created.filledDocument?.templateCode ?? null,
  }
}

const PAYMENT_BASIC_INFO_TEMPLATE_CODES = new Set([
  'agreement-third-party',
  'document-payment-order-pre-consent',
  'agreement-receipt-pre-consent',
])

function readFilledPaymentBasicInfo(
  value: SchemaConsentWriteState['paymentBasicInfo'],
): Record<string, unknown> | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined
  if (Object.keys(value).length === 0) return undefined
  return value as Record<string, unknown>
}

export function buildPortalConsentFilledDocument(
  consentKey: DocumentConsentWriteKey,
  state: SchemaConsentWriteState,
): {
  templateVersionId?: number | null
  templateCode: string
  schemaJson: WritingFormDraft
  paymentBasicInfo?: Record<string, unknown>
} {
  const { templateId } = resolveDocumentConsentTemplate(consentKey)
  const templateCode = state.portalDocument?.templateCode?.trim() || templateId
  const paymentBasicInfo = PAYMENT_BASIC_INFO_TEMPLATE_CODES.has(templateCode)
    ? templateCode === 'agreement-receipt-pre-consent'
      ? toReceiptPreConsentFilledBasicInfo(state.paymentBasicInfo)
      : readFilledPaymentBasicInfo(state.paymentBasicInfo)
    : undefined
  return {
    templateVersionId: state.portalDocument?.templateVersionId,
    templateCode,
    schemaJson: state.draft,
    ...(paymentBasicInfo ? { paymentBasicInfo } : {}),
  }
}

async function resolveDocumentForSubmit(
  consentKey: DocumentConsentWriteKey,
  state: SchemaConsentWriteState,
): Promise<{ documentId: number; templateVersionId?: number | null; templateCode?: string | null }> {
  if (state.portalDocument?.documentId != null) {
    return state.portalDocument
  }
  const consentType = resolvePortalConsentCreateType(consentKey)
  const created = await createPortalConsentDocument({ consentType })
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }
  const version = readCreatedConsentTemplateVersion(created)
  return {
    documentId,
    templateVersionId: version.templateVersionId,
    templateCode: version.templateCode,
  }
}

/** 마이페이지 설정 — Portal document create → sign fields → complete */
export async function submitPortalConsentDocumentFromWriteState(
  consentKey: DocumentConsentWriteKey,
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
/** 초상권 DRAFT 문서 생성 — 응답 `formTemplateVersion.schemaJson`이 서버(CMS) 현재 양식 */
export function createPortraitConsentDraftDocument(
  programTarget?: { programId: number },
): Promise<PortalConsentDocumentDetail> {
  return createPortalConsentDocument(
    buildPortalPortraitRightsConsentCreateRequest(
      programTarget ? { programId: programTarget.programId } : undefined,
    ),
  )
}

export async function submitPortalPortraitConsentFromWriteState(
  state: PortraitPortalConsentWriteState,
  options?: {
    programTarget?: { programId: number }
    /** 만 14세 미만 complete 필수. 화면·로그에 출력하지 않는다. */
    guardianVerificationToken?: string
    /**
     * 작성 진입 시 이미 만든 DRAFT 문서(서버 현재 양식 버전 포함). 있으면 재생성하지 않고
     * 화면에 보여준 양식 버전 그대로 제출한다.
     */
    createdDocument?: PortalConsentDocumentDetail | null
  },
): Promise<void> {
  const programTarget = options?.programTarget
  const guardianVerificationToken = options?.guardianVerificationToken?.trim()
  const created =
    options?.createdDocument?.documentId != null
      ? options.createdDocument
      : await createPortraitConsentDraftDocument(programTarget)
  const documentId = created.documentId
  if (documentId == null) {
    throw new Error('동의서 문서를 만들지 못했습니다.')
  }

  await signDocumentSignatureFields(documentId, state, { fallbackSlot: 'final' })

  const version = readCreatedConsentTemplateVersion(created)
  const filledDocument = buildPortraitFilledDocument(state.draft, version)
  const hints = resolvePortraitPortalCompleteHints(state.draft)

  await completePortalConsentDocument(documentId, {
    filledDocument: {
      ...(filledDocument.templateVersionId != null
        ? { templateVersionId: filledDocument.templateVersionId }
        : {}),
      ...(filledDocument.templateCode ? { templateCode: filledDocument.templateCode } : {}),
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
  consentKey: DocumentConsentWriteKey,
  input: { evidenceFileObjectId: number; session: CrimeConsentSubmitSession },
): Promise<void> {
  const consentType = resolvePortalConsentCreateType(consentKey)
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
