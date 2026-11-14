import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import {
  dataUrlToFile,
  uploadConsentEvidenceFile,
} from '@/features/user/api/upload-consent-evidence-file'
import type {
  MemberConsentAgreementDraftSnapshot,
  MemberConsentCrimeDraftSnapshot,
  MemberRegisterConsentWriteSnapshots,
} from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import type { FilledDocumentRequest } from '@/shared/api/generated/members/schemas/filledDocumentRequest'
import type { FilledDocumentRequestSchemaJson } from '@/shared/api/generated/members/schemas/filledDocumentRequestSchemaJson'
import type { PaymentStatementBasicInfo } from '@/shared/api/generated/members/schemas/paymentStatementBasicInfo'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import { ensurePaymentStatementDefaultPurpose } from '@jakorea/form-schema/consent'
import { normalizeNoticeIdTypeResidentInputInDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  getFileStatus,
  isFileAvailable,
  shouldMockAdminFileUpload,
  waitUntilFileAvailable,
} from '@/shared/lib/admin-file-upload'

const AGREEMENT_TEMPLATE_CODE_BY_TERMS_TYPE: Record<string, string> = {
  PORTRAIT_RIGHTS: 'agreement-portrait',
  PAYMENT_STATEMENT_PRE_CONSENT: 'agreement-third-party',
  PAYMENT_STATEMENT_CONSENT: 'agreement-third-party',
  RECEIPT_PRE_CONSENT: 'agreement-receipt-pre-consent',
  FACILITATOR_PLEDGE: 'agreement-expense',
  ADMINISTRATIVE_INFO_CONSENT: 'agreement-notice',
}

const SNAPSHOT_FIELD_KEYS_BY_TERMS_TYPE: Record<string, string[]> = {
  PORTRAIT_RIGHTS: ['consentPortrait'],
  PAYMENT_STATEMENT_PRE_CONSENT: ['consentPaymentStatement', 'consentWithholdingTax'],
  PAYMENT_STATEMENT_CONSENT: ['consentPaymentStatement', 'consentWithholdingTax'],
  RECEIPT_PRE_CONSENT: ['consentReceiptPreConsent'],
  FACILITATOR_PLEDGE: ['consentEducatorPledge', 'consentFacilitatorPledge'],
  ADMINISTRATIVE_INFO_CONSENT: ['consentAdministrativeJoint'],
  CRIMINAL_HISTORY_CHECK_CONSENT: ['consentSexOffenseCheck'],
}

const CRIME_TERMS_TYPES = new Set(['CRIMINAL_HISTORY_CHECK_CONSENT'])

const FILLED_DOCUMENT_TERMS_TYPES = new Set(Object.keys(AGREEMENT_TEMPLATE_CODE_BY_TERMS_TYPE))

export type AttachFilledDocumentsMode = 'create' | 'patch'

export type AttachFilledDocumentsOptions = {
  mode: AttachFilledDocumentsMode
  snapshots?: MemberRegisterConsentWriteSnapshots
  uploadCrimeEvidence?: (file: File, originalFileName: string) => Promise<number>
}

function snapshotByTermsType<T>(
  bag: Partial<Record<string, T>> | undefined,
  termsType: string
): T | undefined {
  if (!bag) return undefined
  for (const key of SNAPSHOT_FIELD_KEYS_BY_TERMS_TYPE[termsType] ?? []) {
    const hit = bag[key]
    if (hit != null) return hit
  }
  return undefined
}

function trimText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function mapPaymentBasicInfo(
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
): PaymentStatementBasicInfo | undefined {
  if (values == null) return undefined
  const { paymentPurpose } = ensurePaymentStatementDefaultPurpose({
    paymentPurpose: values.paymentPurpose,
  })
  const mapped: PaymentStatementBasicInfo = {
    nameKo: trimText(values.nameKo),
    nameEn: trimText(values.nameEn),
    residentFront: trimText(values.residentFront),
    residentBack: trimText(values.residentBack),
    affiliation: trimText(values.affiliation),
    noAffiliation: values.noAffiliation,
    addressRoad: trimText(values.addressRoad),
    addressDetail: trimText(values.addressDetail),
    bankName: trimText(values.bankName),
    accountNumber: trimText(values.accountNumber),
    accountHolder: trimText(values.accountHolder),
    paymentPurpose,
  }
  return mapped
}

export function mapAgreementSnapshotToFilledDocument(
  termsType: string,
  snapshot: MemberConsentAgreementDraftSnapshot
): FilledDocumentRequest {
  const templateCode = AGREEMENT_TEMPLATE_CODE_BY_TERMS_TYPE[termsType]
  const request: FilledDocumentRequest = {
    schemaJson: normalizeNoticeIdTypeResidentInputInDraft(snapshot.draft) as unknown as FilledDocumentRequestSchemaJson,
  }
  if (templateCode) request.templateCode = templateCode
  if (templateCode === 'agreement-third-party') {
    request.paymentBasicInfo = mapPaymentBasicInfo(snapshot.paymentBasicInfo)
  }
  if (templateCode === 'agreement-receipt-pre-consent') {
    const mapped = mapPaymentBasicInfo(snapshot.paymentBasicInfo)
    if (mapped) {
      request.paymentBasicInfo = {
        nameKo: mapped.nameKo,
        nameEn: mapped.nameEn,
        addressRoad: mapped.addressRoad,
        addressDetail: mapped.addressDetail,
        bankName: mapped.bankName,
        accountNumber: mapped.accountNumber,
        accountHolder: mapped.accountHolder,
        paymentPurpose: mapped.paymentPurpose,
      }
    }
  }
  return request
}

export function isCrimeConsentReadyForSubmit(
  snapshot: MemberConsentCrimeDraftSnapshot | undefined | null
): boolean {
  if (snapshot == null) return false
  const existingObjectId = snapshot.evidenceFileObjectId
  if (existingObjectId != null && Number.isFinite(existingObjectId) && existingObjectId >= 1) {
    return true
  }
  return resolveCrimeEvidenceFile(snapshot) != null
}

export function resolveCrimeEvidenceFile(
  snapshot: MemberConsentCrimeDraftSnapshot
): { file: File; originalFileName: string } | null {
  const originalFileName = snapshot.replacementFileName?.trim() || 'crime-consent.png'
  if (snapshot.file instanceof File && snapshot.file.size > 0) {
    return { file: snapshot.file, originalFileName }
  }
  const fromDataUrl = dataUrlToFile(snapshot.displaySrc, originalFileName)
  if (fromDataUrl != null && fromDataUrl.size > 0) {
    return { file: fromDataUrl, originalFileName }
  }
  return null
}

function isDocumentTermsType(termsType: string): boolean {
  return FILLED_DOCUMENT_TERMS_TYPES.has(termsType) || CRIME_TERMS_TYPES.has(termsType)
}

function missingDocumentMessage(termsType: string): string {
  if (CRIME_TERMS_TYPES.has(termsType)) {
    return '성범죄 동의서 첨부 파일을 찾을 수 없습니다. 동의서를 다시 작성해 주세요.'
  }
  return '작성된 동의서 본문을 찾을 수 없습니다. 동의서를 다시 작성해 주세요.'
}

/** pre-register `CONSENT_ORIGINAL_FILE_NOT_READY` 방지 — CLEAN+AVAILABLE 뒤에만 연결된다 */
async function ensureCrimeEvidenceFileReady(fileObjectId: number): Promise<void> {
  if (shouldMockAdminFileUpload()) return
  const current = await getFileStatus(fileObjectId)
  if (isFileAvailable(current)) return
  try {
    await waitUntilFileAvailable(fileObjectId, { maxAttempts: 90, intervalMs: 2_000 })
  } catch {
    throw new Error(
      '성범죄 동의서 파일의 보안 검사가 아직 완료되지 않았습니다. 잠시 후 다시 등록해 주세요.'
    )
  }
}

/**
 * 등록·PATCH `termsAgreements`에 작성 본문(`filledDocument`)·성범죄 파일 id를 붙인다.
 * `agreed: false` 행은 본문을 보내지 않는다.
 * PATCH에서 이번 세션 스냅샷이 없는 동의서 행은 서버 원문을 유지하도록 제외한다.
 */
export async function attachFilledDocumentsToTermsAgreements(
  rows: TermsAgreementRequest[] | undefined,
  options: AttachFilledDocumentsOptions
): Promise<TermsAgreementRequest[] | undefined> {
  if (rows == null) return rows
  const snapshots = options.snapshots
  const uploadCrime =
    options.uploadCrimeEvidence ??
    ((file: File, originalFileName: string) =>
      uploadConsentEvidenceFile({ file, originalFileName }))

  const next: TermsAgreementRequest[] = []
  for (const row of rows) {
    const termsType = row.termsType?.trim() ?? ''
    if (!isDocumentTermsType(termsType) || row.agreed !== true) {
      const { filledDocument: _filled, evidenceFileObjectId: _evidence, evidenceOriginalFileName: _name, ...rest } =
        row
      next.push(rest)
      continue
    }

    if (CRIME_TERMS_TYPES.has(termsType)) {
      const crime = snapshotByTermsType(snapshots?.crimeByFieldKey, termsType)
      if (crime == null) {
        if (options.mode === 'patch') continue
        throw new Error(missingDocumentMessage(termsType))
      }
      const originalFileName = crime.replacementFileName?.trim() || 'crime-consent.png'
      const existingObjectId = crime.evidenceFileObjectId
      if (
        existingObjectId != null &&
        Number.isFinite(existingObjectId) &&
        existingObjectId >= 1
      ) {
        await ensureCrimeEvidenceFileReady(existingObjectId)
        next.push({
          ...row,
          filledDocument: undefined,
          evidenceFileObjectId: existingObjectId,
          evidenceOriginalFileName: originalFileName,
        })
        continue
      }
      const resolved = resolveCrimeEvidenceFile(crime)
      if (resolved == null) {
        if (options.mode === 'patch') continue
        throw new Error(missingDocumentMessage(termsType))
      }
      const evidenceFileObjectId = await uploadCrime(resolved.file, resolved.originalFileName)
      next.push({
        ...row,
        filledDocument: undefined,
        evidenceFileObjectId,
        evidenceOriginalFileName: resolved.originalFileName,
      })
      continue
    }

    const agreement = snapshotByTermsType(snapshots?.agreementByFieldKey, termsType)
    if (agreement?.draft == null) {
      if (options.mode === 'patch') continue
      throw new Error(missingDocumentMessage(termsType))
    }
    next.push({
      ...row,
      evidenceFileObjectId: undefined,
      evidenceOriginalFileName: undefined,
      filledDocument: mapAgreementSnapshotToFilledDocument(termsType, agreement),
    })
  }

  if (options.mode === 'patch' && next.length === 0) return undefined
  return next
}

export type CrimeConsentOriginalLinkSplit = {
  /** 회원 상세 단독 PATCH로 보낼 성범죄 원본 연결 1건 (없으면 null) */
  crimeOriginalLink: TermsAgreementRequest | null
  /** 나머지 termsAgreements (없으면 undefined — 프로필 PATCH에 termsAgreements를 싣지 않는다) */
  rest: TermsAgreementRequest[] | undefined
}

/**
 * 회원 상세 PATCH — 성범죄 동의서 서명 원본 연결·재업로드·재동의는 BE 예외 형식(단독 PATCH, termsAgreements 1건,
 * filledDocument 없음, 현재 게시된 약관 version)으로만 받는다 (BE 2026-11-14).
 * 프로필 필드·다른 동의와 섞으면 409 `CMS_MEMBER_TERMS_NOT_EDITABLE`이므로 분리한다.
 */
export function splitCrimeConsentOriginalLinkForPatch(
  rows: TermsAgreementRequest[] | undefined
): CrimeConsentOriginalLinkSplit {
  if (!rows?.length) return { crimeOriginalLink: null, rest: rows }
  let crimeOriginalLink: TermsAgreementRequest | null = null
  const rest: TermsAgreementRequest[] = []
  for (const row of rows) {
    const evidenceFileObjectId = row.evidenceFileObjectId
    const isCrimeOriginalLink =
      crimeOriginalLink == null &&
      CRIME_TERMS_TYPES.has(row.termsType?.trim() ?? '') &&
      row.agreed === true &&
      evidenceFileObjectId != null &&
      Number.isFinite(evidenceFileObjectId) &&
      evidenceFileObjectId >= 1
    if (isCrimeOriginalLink) {
      crimeOriginalLink = {
        termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
        version: row.version,
        agreed: true,
        evidenceFileObjectId,
      }
      continue
    }
    rest.push(row)
  }
  return { crimeOriginalLink, rest: rest.length > 0 ? rest : undefined }
}
