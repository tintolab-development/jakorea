import type { AgreementKey, AgreementState } from '../../model/sign-up.types'
import { agreementItems } from '../constants'
import { isAllAgreed, isRequiredAgreed } from '../utils'

export { agreementItems }

export function createInitialAgreementState(): AgreementState {
  return {
    service: false,
    privacy: false,
    marketing: false,
    portrait: false,
  }
}

export function toggleAgreementState(
  agreements: AgreementState,
  key: AgreementKey,
): AgreementState {
  return { ...agreements, [key]: !agreements[key] }
}

export function toggleAllAgreementState(agreements: AgreementState): AgreementState {
  const next = !isAllAgreed(agreements, agreementItems)
  return {
    service: next,
    privacy: next,
    marketing: next,
    portrait: next,
  }
}

export function getAgreementDerived(agreements: AgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, agreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, agreementItems),
  }
}
