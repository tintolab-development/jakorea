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

export function toggleAllAgreementState(nextValue: boolean): AgreementState {
  return {
    service: nextValue,
    privacy: nextValue,
    marketing: nextValue,
    portrait: nextValue,
  }
}

export function getAgreementDerived(agreements: AgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, agreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, agreementItems),
  }
}
