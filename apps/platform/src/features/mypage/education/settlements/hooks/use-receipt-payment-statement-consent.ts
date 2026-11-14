import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsConsents } from '@/features/mypage/settings/hooks/use-settings-consents'
import { isPaymentStatementPreConsentSubmitted } from '@/features/mypage/settings/lib/payment-statement-consent-status'
import { isReceiptPreConsentSubmitted } from '../lib/receipt-consent-status'
import {
  buildSettlementPaymentConsentPath,
  buildSettlementReceiptConsentPath,
} from '../lib/consent-path'
import type { SettlementDocumentKind } from '../lib/settlement-status-ui'
import type { SettlementArea } from '../lib/write-path'
import { useReceiptMinorGuardianGate } from './use-receipt-minor-guardian-gate'

export function useSettlementPreConsent(options: {
  documentKind: SettlementDocumentKind
  applicationId?: string
  area?: SettlementArea
  applicationType?: string
  /** 영수증 동의서 작성 완료 후 복귀 경로 (기본값 정산 현황 탭) */
  returnTo?: string
}) {
  const navigate = useNavigate()
  const consents = useSettingsConsents()
  const [modalOpen, setModalOpen] = useState(false)
  const submitted =
    options.documentKind === 'receipt'
      ? isReceiptPreConsentSubmitted(consents.documentItems)
      : isPaymentStatementPreConsentSubmitted(consents.documentItems)

  const receiptConsentWritePath =
    options.documentKind === 'receipt' && options.applicationId
      ? buildSettlementReceiptConsentPath({
          applicationId: options.applicationId,
          mode: 'write',
          area: options.area,
          applicationType: options.applicationType,
          returnTo: options.returnTo,
        })
      : null
  /**
   * 만 14세 미만 회원의 영수증 사전동의 — 안내 모달 대신 보호자 본인인증(01) → 보호자 정보 입력(02) 팝업.
   * 시안: 교육현황 상세_정산 현황 만 14세 미만 회원 01·02.
   */
  const minorGuardian = useReceiptMinorGuardianGate({ consentWritePath: receiptConsentWritePath })
  const useMinorGuardianGate = options.documentKind === 'receipt' && minorGuardian.isMinor

  const tryWrite = (path: string) => {
    if (consents.isLoading || minorGuardian.isMemberLoading) return
    if (submitted) {
      navigate(path)
      return
    }
    if (useMinorGuardianGate) {
      minorGuardian.start()
      return
    }
    setModalOpen(true)
  }

  const goToConsents = () => {
    setModalOpen(false)
    if (!options.applicationId) return
    if (options.documentKind === 'receipt') {
      if (useMinorGuardianGate) {
        minorGuardian.start()
        return
      }
      if (receiptConsentWritePath) navigate(receiptConsentWritePath)
      return
    }
    navigate(
      buildSettlementPaymentConsentPath({
        applicationId: options.applicationId,
        mode: 'write',
        area: options.area,
        applicationType: options.applicationType,
      }),
    )
  }

  return {
    isConsentLoading: consents.isLoading || minorGuardian.isMemberLoading,
    isConsentSubmitted: submitted,
    modalOpen,
    closeModal: () => setModalOpen(false),
    tryWrite,
    tryWriteReceipt: tryWrite,
    goToConsents,
    /** 만 14세 미만 영수증 — `ReceiptGuardianGateModals`에 넘긴다 */
    minorGuardian: minorGuardian.flowProps,
  }
}

export function useReceiptPaymentStatementConsent(options?: {
  applicationId?: string
  area?: SettlementArea
  applicationType?: string
  returnTo?: string
}) {
  return useSettlementPreConsent({
    documentKind: 'receipt',
    applicationId: options?.applicationId,
    area: options?.area,
    applicationType: options?.applicationType,
    returnTo: options?.returnTo,
  })
}
