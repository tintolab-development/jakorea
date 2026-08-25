import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export type MemberConsentAgreementDraftSnapshot = {
  draft: WritingFormDraft
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoAutofillValues>
}

export type MemberConsentCrimeDraftSnapshot = {
  displaySrc: string
  replacementFileName: string | null
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
