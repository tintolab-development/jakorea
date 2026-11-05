import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsConsents } from '@/features/mypage/settings/hooks/use-settings-consents'
import { isReceiptPreConsentSubmitted } from '../lib/receipt-consent-status'
import { buildSettlementReceiptConsentPath } from '../lib/consent-path'
import type { SettlementArea } from '../lib/write-path'

export function useReceiptPaymentStatementConsent(options?: {
  applicationId?: string
  area?: SettlementArea
  applicationType?: string
}) {
  const navigate = useNavigate()
  const consents = useSettingsConsents()
  const [modalOpen, setModalOpen] = useState(false)
  const submitted = isReceiptPreConsentSubmitted(consents.documentItems)

  const tryWriteReceipt = (path: string) => {
    if (consents.isLoading) return
    if (submitted) {
      navigate(path)
      return
    }
    setModalOpen(true)
  }

  const goToConsents = () => {
    setModalOpen(false)
    if (!options?.applicationId) return
    navigate(
      buildSettlementReceiptConsentPath({
        applicationId: options.applicationId,
        mode: 'write',
        area: options.area,
        applicationType: options.applicationType,
      }),
    )
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
