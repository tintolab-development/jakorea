import { ProgramGuardianIdentityModal } from '@/features/program/ui/program-apply-gate-modals/program-guardian-identity-modal'
import { PortraitGuardianInfoModal } from '@/features/mypage/settings/ui/portrait-guardian-info-modal'
import type { ReceiptMinorGuardianFlowProps } from '../hooks/use-receipt-minor-guardian-gate'
import {
  RECEIPT_GUARDIAN_IDENTITY_COPY,
  RECEIPT_GUARDIAN_INFO_COPY,
} from '../lib/receipt-guardian-consent-copy'

/**
 * 만 14세 미만 회원 영수증 사전동의 — 보호자 본인인증(01) → 보호자 정보 입력 안내(02) 팝업.
 * 초상권 흐름의 모달을 영수증 문구로 재사용한다.
 */
export function ReceiptGuardianGateModals({ flow }: { flow: ReceiptMinorGuardianFlowProps }) {
  return (
    <>
      <ProgramGuardianIdentityModal
        open={flow.step === 'identity'}
        copy={RECEIPT_GUARDIAN_IDENTITY_COPY}
        errorMessage={flow.identityError}
        onClose={flow.onCancel}
        onVerify={flow.onOpenInfo}
      />
      <PortraitGuardianInfoModal
        open={flow.step === 'info'}
        description={RECEIPT_GUARDIAN_INFO_COPY.description}
        confirmLabel={RECEIPT_GUARDIAN_INFO_COPY.confirmLabel}
        guardianName={flow.guardianName}
        guardianPhone={flow.guardianPhone}
        relation={flow.relation}
        relationError={flow.relationError}
        confirmLoading={flow.verifying}
        onRelationChange={flow.onRelationChange}
        onCancel={flow.onCancel}
        onConfirm={flow.onConfirmInfo}
      />
    </>
  )
}
