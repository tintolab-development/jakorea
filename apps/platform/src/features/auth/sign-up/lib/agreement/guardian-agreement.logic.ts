import type {
  GuardianAgreementKey,
  GuardianAgreementState,
} from '../../model/sign-up.types'
import { guardianAgreementItems } from '../constants'
import { isAllAgreed, isRequiredAgreed } from '../utils'

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

export function toggleAllGuardianAgreementState(
  agreements: GuardianAgreementState,
): GuardianAgreementState {
  const next = !isAllAgreed(agreements, guardianAgreementItems)
  return {
    service: next,
    privacy: next,
    guardianLegal: next,
    marketing: next,
    portrait: next,
  }
}

export function getGuardianAgreementDerived(agreements: GuardianAgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, guardianAgreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, guardianAgreementItems),
  }
}
