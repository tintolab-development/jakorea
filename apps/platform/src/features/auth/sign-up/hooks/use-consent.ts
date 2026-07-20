import { useCallback, useMemo, useState } from 'react'
import type { SignUpConsentFieldKey, SignUpConsentState } from '../model/consent.types'

const INITIAL_CONSENT: SignUpConsentState = {
  serviceTerms: false,
  privacyCollection: false,
  mfaSetup: false,
  marketing: false,
}

const REQUIRED_CONSENT_KEYS: SignUpConsentFieldKey[] = [
  'serviceTerms',
  'privacyCollection',
  'mfaSetup',
]

export function useSignUpConsent(initialValue: SignUpConsentState = INITIAL_CONSENT) {
  const [consent, setConsent] = useState<SignUpConsentState>(initialValue)

  const allChecked = useMemo(
    () => Object.values(consent).every(Boolean),
    [consent],
  )

  const isRequiredValid = useMemo(
    () => REQUIRED_CONSENT_KEYS.every(key => consent[key]),
    [consent],
  )

  const setField = useCallback((key: SignUpConsentFieldKey, checked: boolean) => {
    setConsent(previous => ({ ...previous, [key]: checked }))
  }, [])

  const toggleAll = useCallback(() => {
    const nextChecked = !allChecked
    setConsent({
      serviceTerms: nextChecked,
      privacyCollection: nextChecked,
      mfaSetup: nextChecked,
      marketing: nextChecked,
    })
  }, [allChecked])

  return {
    consent,
    setConsent,
    setField,
    toggleAll,
    allChecked,
    isRequiredValid,
  }
}
