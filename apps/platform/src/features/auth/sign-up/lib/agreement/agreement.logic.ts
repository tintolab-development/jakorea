import type { AgreementItem, AgreementKey, AgreementState } from '../../model/sign-up.types'
import { agreementItems, getAgreementItems } from '../constants'
import { isAllAgreed, isRequiredAgreed } from '../utils'

export { agreementItems, getAgreementItems }

export function createInitialAgreementState(): AgreementState {
  return {
    service: false,
    privacy: false,
    teacherInfo: false,
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

export function toggleAllAgreementState(
  agreements: AgreementState,
  items: AgreementItem[] = agreementItems,
): AgreementState {
  const next = !isAllAgreed(agreements, items)
  const nextState = { ...agreements }
  for (const item of items) {
    nextState[item.key] = next
  }
  return nextState
}

export function getAgreementDerived(
  agreements: AgreementState,
  items: AgreementItem[] = agreementItems,
) {
  return {
    isAllAgreed: isAllAgreed(agreements, items),
    isRequiredAgreed: isRequiredAgreed(agreements, items),
  }
}
