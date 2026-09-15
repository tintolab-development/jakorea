import { useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import './user-personal-info-reveal-confirm-modal.css'

export interface UserPersonalInfoRevealConfirmModalProps {
  onCancel: () => void
  /** 사유 검증은 모달에서 수행 후 전달 */
  onConfirm: (reason: string) => void
  zIndex?: number
}

/** 부모에서 `personalInfoRevealConfirmOpen`일 때만 마운트해 입력 상태를 초기화합니다. */
export function UserPersonalInfoRevealConfirmModal({
  onCancel,
  onConfirm,
  zIndex,
}: UserPersonalInfoRevealConfirmModalProps) {
  const { showAlert } = useCmsAlert()
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    onConfirm(trimmedReason)
  }

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="개인정보 상세보기"
      width={600}
      zIndex={zIndex}
      footer={
        <>
          <CmsButton variant="secondary" width={70} type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" width={100} type="button" onClick={handleConfirm}>
            정보 열람
          </CmsButton>
        </>
      }
    >
      <div className="user-personal-info-reveal-confirm-modal">
        <p className="user-personal-info-reveal-confirm-modal__lead">
          마스킹 처리를 해제하고 개인정보를 열람하시겠습니까?
          <br />
          마스킹 처리 해제를 희망하실 경우, 개인정보 열람 사유를 입력해 주세요.
        </p>
        <label className="user-personal-info-reveal-confirm-modal__label" htmlFor="privacy-reveal-reason">
          개인정보 열람 사유{' '}
          <span className="user-personal-info-reveal-confirm-modal__required" aria-hidden>
            *
          </span>
        </label>
        <CmsInput
          id="privacy-reveal-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          width={'100%'}
          placeholder="열람 사유를 입력해 주세요"
        />
      </div>
    </ContentModal>
  )
}
