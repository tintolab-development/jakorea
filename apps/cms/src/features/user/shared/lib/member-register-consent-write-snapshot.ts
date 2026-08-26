import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export type MemberConsentAgreementDraftSnapshot = {
  draft: WritingFormDraft
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoAutofillValues>
}

export type MemberConsentCrimeDraftSnapshot = {
  displaySrc: string
  replacementFileName: string | null
  /** 제출 시 object storage 업로드용. 세션 메모리에만 유지 */
  file?: File
}

export type MemberRegisterConsentWriteSnapshots = {
  agreementByFieldKey: Partial<Record<string, MemberConsentAgreementDraftSnapshot>>
  crimeByFieldKey: Partial<Record<string, MemberConsentCrimeDraftSnapshot>>
}

export function createEmptyMemberRegisterConsentWriteSnapshots(): MemberRegisterConsentWriteSnapshots {
  return { agreementByFieldKey: {}, crimeByFieldKey: {} }
}

export function cloneMemberConsentAgreementDraftSnapshot(
  snapshot: MemberConsentAgreementDraftSnapshot
): MemberConsentAgreementDraftSnapshot {
  return {
    draft: structuredClone(snapshot.draft),
    paymentBasicInfo: snapshot.paymentBasicInfo
      ? { ...snapshot.paymentBasicInfo }
      : undefined,
  }
}

export function upsertConsentAgreementWriteSnapshot(
  existing: MemberRegisterConsentWriteSnapshots | undefined,
  fieldKey: string,
  snapshot: MemberConsentAgreementDraftSnapshot
): MemberRegisterConsentWriteSnapshots {
  const base = existing ?? createEmptyMemberRegisterConsentWriteSnapshots()
  return {
    ...base,
    agreementByFieldKey: { ...base.agreementByFieldKey, [fieldKey]: snapshot },
  }
}

export function upsertConsentCrimeWriteSnapshot(
  existing: MemberRegisterConsentWriteSnapshots | undefined,
  fieldKey: string,
  snapshot: MemberConsentCrimeDraftSnapshot
): MemberRegisterConsentWriteSnapshots {
  const base = existing ?? createEmptyMemberRegisterConsentWriteSnapshots()
  return {
    ...base,
    crimeByFieldKey: { ...base.crimeByFieldKey, [fieldKey]: snapshot },
  }
}

export function clearConsentWriteSnapshot(
  existing: MemberRegisterConsentWriteSnapshots | undefined,
  fieldKey: string
): MemberRegisterConsentWriteSnapshots {
  const base = existing ?? createEmptyMemberRegisterConsentWriteSnapshots()
  const { [fieldKey]: _agreement, ...agreementByFieldKey } = base.agreementByFieldKey
  const { [fieldKey]: _crime, ...crimeByFieldKey } = base.crimeByFieldKey
  return { agreementByFieldKey, crimeByFieldKey }
}
