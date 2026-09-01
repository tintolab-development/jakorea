import type { MemberConsentFieldKey, MemberConsentTemplateEntry } from '@/features/user/shared/lib/member-consent-template-map'
import {
  isAgreementMemberConsentField,
  isMemberCrimeConsentField,
  resolveMemberConsentTemplateEntry,
} from '@/features/user/shared/lib/member-consent-template-map'

export type InstructorConsentFieldKey =
  | 'consentPortrait'
  | 'consentPaymentStatement'
  | 'consentEducatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'

const INSTRUCTOR_TO_MEMBER_CONSENT_FIELD: Record<
  InstructorConsentFieldKey,
  MemberConsentFieldKey
> = {
  consentPortrait: 'consentPortrait',
  consentPaymentStatement: 'consentWithholdingTax',
  consentEducatorPledge: 'consentFacilitatorPledge',
  consentAdministrativeJoint: 'consentAdministrativeJoint',
  consentSexOffenseCheck: 'consentSexOffenseCheck',
}

export function resolveInstructorConsentMemberFieldKey(
  fieldKey: InstructorConsentFieldKey
): MemberConsentFieldKey {
  return INSTRUCTOR_TO_MEMBER_CONSENT_FIELD[fieldKey]
}

export function resolveInstructorConsentTemplateEntry(
  fieldKey: InstructorConsentFieldKey
): MemberConsentTemplateEntry {
  return resolveMemberConsentTemplateEntry(resolveInstructorConsentMemberFieldKey(fieldKey))
}

export function isInstructorCrimeConsentField(fieldKey: InstructorConsentFieldKey): boolean {
  return isMemberCrimeConsentField(resolveInstructorConsentMemberFieldKey(fieldKey))
}

export function isAgreementInstructorConsentField(
  fieldKey: InstructorConsentFieldKey
): fieldKey is Exclude<InstructorConsentFieldKey, 'consentSexOffenseCheck'> {
  return isAgreementMemberConsentField(resolveInstructorConsentMemberFieldKey(fieldKey))
}
