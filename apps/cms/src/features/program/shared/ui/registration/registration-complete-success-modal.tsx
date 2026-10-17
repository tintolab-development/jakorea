/**
 * 프로그램 등록 완료 — 공통 ActionResultModal (모든 프로그램 유형)
 */

import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { MESSAGES } from '@/shared/constants/messages'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'

export const PROGRAM_REGISTRATION_COMPLETE_MODAL_TITLE = '등록 완료'
export const PROGRAM_REGISTRATION_COMPLETE_MODAL_BODY = MESSAGES.success.created

export type RegistrationCompleteSuccessModalProps = {
  open: boolean
  onConfirm: () => void
}

export function RegistrationCompleteSuccessModal({
  open,
  onConfirm,
}: RegistrationCompleteSuccessModalProps) {
  return (
    <ActionResultModal
      open={open}
      onClose={onConfirm}
      title={PROGRAM_REGISTRATION_COMPLETE_MODAL_TITLE}
      body={PROGRAM_REGISTRATION_COMPLETE_MODAL_BODY}
      zIndex={CMS_ALERT_MODAL_Z_INDEX}
    />
  )
}
