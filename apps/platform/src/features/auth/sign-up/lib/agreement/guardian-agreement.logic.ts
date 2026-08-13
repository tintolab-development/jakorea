import type {
  ConsentChoice,
  GuardianAgreementKey,
  GuardianAgreementState,
} from '../../model/sign-up.types'
import { guardianAgreementItems } from '../constants'
import { isAllAgreed, isRequiredAgreed, listDisagreedRequiredLabels } from '../utils'

export { guardianAgreementItems }

export function createInitialGuardianAgreementState(): GuardianAgreementState {
  return {
    service: null,
    privacy: null,
    guardianLegal: null,
    marketing: null,
    portrait: null,
  }
}

export function setGuardianAgreementChoice(
  agreements: GuardianAgreementState,
  key: GuardianAgreementKey,
  choice: ConsentChoice,
): GuardianAgreementState {
  return { ...agreements, [key]: choice }
}

export function setAllGuardianAgreementChoices(choice: ConsentChoice): GuardianAgreementState {
  return {
    service: choice,
    privacy: choice,
    guardianLegal: choice,
    marketing: choice,
    portrait: choice,
  }
}

export function getGuardianAgreementDerived(agreements: GuardianAgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, guardianAgreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, guardianAgreementItems),
    disagreedRequiredLabels: listDisagreedRequiredLabels(agreements, guardianAgreementItems),
  }
}
