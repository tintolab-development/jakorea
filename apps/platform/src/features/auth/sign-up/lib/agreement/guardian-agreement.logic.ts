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

export function setGuardianAgreementState(
  agreements: GuardianAgreementState,
  key: GuardianAgreementKey,
  agreed: boolean,
): GuardianAgreementState {
  if (agreements[key] === agreed) return agreements
  return { ...agreements, [key]: agreed }
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

/** 필수 약관만 일괄 동의/해제 (선택 항목은 유지) */
export function toggleAllRequiredGuardianAgreementState(
  agreements: GuardianAgreementState,
): GuardianAgreementState {
  const nextRequired = !isRequiredAgreed(agreements, guardianAgreementItems)
  const next = { ...agreements }
  for (const item of guardianAgreementItems) {
    if (item.required) {
      next[item.key] = nextRequired
    }
  }
  return next
}

export function getGuardianAgreementDerived(agreements: GuardianAgreementState) {
  return {
    isAllAgreed: isAllAgreed(agreements, guardianAgreementItems),
    isRequiredAgreed: isRequiredAgreed(agreements, guardianAgreementItems),
  }
}
