import { buildTermsAgreementsFromCatalog } from '../mapper/map-terms-agreements'
import type { AgreementState, GuardianAgreementState } from '../sign-up.types'
import { validateBirthStep } from '../../lib/identity/identity.logic'
import { readMinorMemberBirthDate } from '../../lib/signup-minor-birth-storage'
import { readSignupWizardFields } from '../../lib/signup-wizard-field-storage'
import type { SignupTermsCatalogResponse } from '../types/signup-api.types'

export function resolveMinorMemberBirthDateForSignup(fallbackBirthDate: string): string | null {
  const fromDedicated = readMinorMemberBirthDate()?.trim()
  if (fromDedicated) return fromDedicated

  const fromWizard = readSignupWizardFields()?.minorMemberBirthDate?.trim()
  if (fromWizard) return fromWizard

  if (validateBirthStep(fallbackBirthDate).status === 'under-age') {
    return fallbackBirthDate.trim()
  }

  return null
}

export function resolveSignupMemberBirthDate(input: {
  isUnderAgeSignup: boolean
  birthDate: string
}): string {
  if (!input.isUnderAgeSignup) return input.birthDate
  return resolveMinorMemberBirthDateForSignup(input.birthDate) ?? input.birthDate
}

/** 미성년 가입 POST 직전 클라이언트 검증 — 실패 시 사용자 메시지 */
export function validateUnderAgeSignupBeforeSubmit(input: {
  birthDate: string
  guardianAgreements: GuardianAgreementState
  agreements: AgreementState
  termsCatalog: SignupTermsCatalogResponse | null | undefined
}): string | null {
  const memberBirth = resolveMinorMemberBirthDateForSignup(input.birthDate)
  if (!memberBirth || validateBirthStep(memberBirth).status !== 'under-age') {
    return '가입자 생년월일(만 14세 미만)을 step 2에서 다시 확인해 주세요.'
  }

  if (!input.guardianAgreements.service || !input.guardianAgreements.privacy) {
    return '보호자 필수 약관 동의를 확인해 주세요.'
  }
  if (!input.guardianAgreements.guardianLegal) {
    return '법정대리인 동의를 확인해 주세요.'
  }

  const terms = buildTermsAgreementsFromCatalog({
    catalog: input.termsCatalog,
    agreements: input.agreements,
    guardianAgreements: input.guardianAgreements,
    isUnderAge: true,
  })

  for (const doc of input.termsCatalog?.terms ?? []) {
    if (!doc.required) continue
    const termsType = doc.agreementPayload?.termsType ?? doc.termsType
    if (!termsType) continue
    const row = terms.find(item => item.termsType === termsType)
    if (!row?.agreed) {
      const label = doc.label ?? doc.title ?? '필수 약관'
      return `${label} 동의를 확인해 주세요.`
    }
  }

  const catalogTypes = new Set(
    (input.termsCatalog?.terms ?? [])
      .map(doc => (doc.agreementPayload?.termsType ?? doc.termsType ?? '').trim().toUpperCase())
      .filter(Boolean),
  )
  if (catalogTypes.has('GUARDIAN_CONSENT') && input.guardianAgreements.guardianLegal) {
    const guardianRow = terms.find(
      item => item.termsType?.trim().toUpperCase() === 'GUARDIAN_CONSENT',
    )
    if (!guardianRow?.agreed) {
      return '법정대리인 동의 약관이 요청에 포함되지 않았습니다. step 2 생년월일 확인 후 다시 시도해 주세요.'
    }
  }

  return null
}
