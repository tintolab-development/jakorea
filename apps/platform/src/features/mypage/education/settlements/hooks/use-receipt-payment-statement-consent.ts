import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MYPAGE_SETTINGS_CONSENTS_TAB } from '@/features/mypage/lib/constants'
import { useSettingsConsents } from '@/features/mypage/settings/hooks/use-settings-consents'
import { isPaymentStatementPreConsentSubmitted } from '@/features/mypage/settings/lib/payment-statement-consent-status'
import { pinSettingsConsentsMenu } from '@/features/mypage/settings/lib/settings-consents-menu'

export function useReceiptPaymentStatementConsent() {
  const navigate = useNavigate()
  const consents = useSettingsConsents()
  const [modalOpen, setModalOpen] = useState(false)
  const submitted = isPaymentStatementPreConsentSubmitted(consents.documentItems)

  const tryWriteReceipt = (path: string) => {
    if (consents.isLoading) return
    if (submitted) {
      navigate(path)
      return
    }
    setModalOpen(true)
  }

  const goToConsents = () => {
    pinSettingsConsentsMenu()
    setModalOpen(false)
    navigate(MYPAGE_SETTINGS_CONSENTS_TAB)
  }

  return {
    isConsentLoading: consents.isLoading,
    isConsentSubmitted: submitted,
    modalOpen,
    closeModal: () => setModalOpen(false),
    tryWriteReceipt,
    goToConsents,
  }
}
