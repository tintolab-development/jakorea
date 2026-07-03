import type { GuardianAgreementKey, GuardianAgreementState } from '../model/sign-up.types'
import { guardianAgreementItems } from '../lib/constants'
import { isAllAgreed, isRequiredAgreed } from '../lib/utils'

export { guardianAgreementItems }

export function createInitialGuardianAgreementState(): GuardianAgreementState {
  return {
    service: false,
    privacy: false,
    guardianLegal: false,
    marketing: false,
    portrait: false,
  }
}

export function toggleGuardianAgreementState(
  agreements: GuardianAgreementState,
  key: GuardianAgreementKey,
): GuardianAgreementState {
  return { ...agreements, [key]: !agreements[key] }
}

export function toggleAllGuardianAgreementState(nextValue: boolean): GuardianAgreementState {
  return {
    service: nextValue,
    privacy: nextValue,
    guardianLegal: nextValue,
    marketing: nextValue,
    portrait: nextValue,
  }
}

export function getGuardianAgreementDerived(agreements: GuardianAgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, guardianAgreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, guardianAgreementItems),
  }
}
