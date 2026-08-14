import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import { isConsentAgreed } from './consent-radio'
import type {
  CrimeConsentDraft,
  EducatorConsentDraft,
  NoticeConsentDraft,
  PaymentConsentDraft,
} from './draft-persist'

function isBlank(value: string): boolean {
  return !value.trim()
}

export function isPaymentConsentIncomplete(draft: PaymentConsentDraft): boolean {
  if (!draft.tableConsents.every(isConsentAgreed)) return true
  if (isBlank(draft.nameKo)) return true
  if (isBlank(draft.residentFront) || isBlank(draft.residentBack)) return true
  if (
    isRequiredAddressIncomplete({
      address: draft.addressRoad,
      addressDetail: draft.addressDetail,
      subject: 'person',
    })
  ) {
    return true
  }
  if (isBlank(draft.bankName) || isBlank(draft.accountNumber) || isBlank(draft.accountHolder)) {
    return true
  }
  if (!draft.noAffiliation && isBlank(draft.affiliation)) return true
  return false
}

export function isEducatorConsentIncomplete(draft: EducatorConsentDraft): boolean {
  return !draft.clauses.every(isConsentAgreed)
}

export function isNoticeConsentIncomplete(draft: NoticeConsentDraft): boolean {
  if (isBlank(draft.institution) || isBlank(draft.purpose)) return true
  if (isBlank(draft.idType) || isBlank(draft.idNumber)) return true
  if (isBlank(draft.name) || isBlank(draft.birthDate) || isBlank(draft.phone)) return true
  return !isConsentAgreed(draft.confirm)
}

export function isCrimeConsentIncomplete(draft: CrimeConsentDraft): boolean {
  return !isConsentAgreed(draft.consent)
}
