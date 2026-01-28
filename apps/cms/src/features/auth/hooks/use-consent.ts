/**
 * 동의 내역 관리 Hook
 * Phase 0.1.2: 회원가입 흐름 (FR-B02)
 */

import { useState, useCallback } from 'react'
import type { ConsentFormData } from '@/types/consent'

interface UseConsentReturn {
  consent: ConsentFormData
  updateConsent: (updates: Partial<ConsentFormData>) => void
  resetConsent: () => void
  isValid: boolean // 필수 동의가 모두 체크되었는지
}

const initialConsent: ConsentFormData = {
  termsOfService: false,
  privacyPolicy: false,
  marketingConsent: false,
}

export function useConsent(): UseConsentReturn {
  const [consent, setConsent] = useState<ConsentFormData>(initialConsent)

  const updateConsent = useCallback((updates: Partial<ConsentFormData>) => {
    setConsent(prev => ({ ...prev, ...updates }))
  }, [])

  const resetConsent = useCallback(() => {
    setConsent(initialConsent)
  }, [])

  const isValid = consent.termsOfService && consent.privacyPolicy

  return {
    consent,
    updateConsent,
    resetConsent,
    isValid,
  }
}
