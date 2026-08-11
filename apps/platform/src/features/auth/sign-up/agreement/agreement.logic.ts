import type { AgreementKey, AgreementState, ConsentChoice } from '../model/sign-up.types'
import { agreementItems } from '../lib/constants'
import { isAllAgreed, isRequiredAgreed, listDisagreedRequiredLabels } from '../lib/utils'

export { agreementItems }

export function createInitialAgreementState(): AgreementState {
  return {
    service: null,
    privacy: null,
    marketing: null,
    portrait: null,
  }
}

export function setAgreementChoice(
  agreements: AgreementState,
  key: AgreementKey,
  choice: ConsentChoice,
): AgreementState {
  return { ...agreements, [key]: choice }
}

export function setAllAgreementChoices(choice: ConsentChoice): AgreementState {
  return {
    service: choice,
    privacy: choice,
    marketing: choice,
    portrait: choice,
  }
}

export function getAgreementDerived(agreements: AgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, agreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, agreementItems),
    disagreedRequiredLabels: listDisagreedRequiredLabels(agreements, agreementItems),
  }
}
