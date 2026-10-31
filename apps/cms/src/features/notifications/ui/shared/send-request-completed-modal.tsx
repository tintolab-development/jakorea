import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  NOTIFICATION_SEND_HISTORY_PATH,
  NOTIFICATION_SEND_HISTORY_TAB_PARAM,
  NOTIFICATION_SEND_REQUEST_COMPLETED_MESSAGE,
  NOTIFICATION_SEND_REQUEST_COMPLETED_TITLE,
  type NotificationSendHistoryChannel,
} from '@/features/notifications/model/shared/send-request-completed-copy'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import '@jakorea/admin-ui/modal/confirm.css'

const MODAL_WIDTH = 600

type SendRequestCompletedModalProps = {
  open: boolean
  channel: NotificationSendHistoryChannel
  /** 발송 풀페이지 닫기(URL 정리 등) */
  onDismissSendScreen: () => void
}

export function SendRequestCompletedModal({
  open,
  channel,
  onDismissSendScreen,
}: SendRequestCompletedModalProps) {
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    onDismissSendScreen()
  }, [onDismissSendScreen])

  const handleViewHistory = useCallback(() => {
    onDismissSendScreen()
    navigate(
      `${NOTIFICATION_SEND_HISTORY_PATH[channel]}?tab=${NOTIFICATION_SEND_HISTORY_TAB_PARAM}`
    )
  }, [channel, navigate, onDismissSendScreen])

  return (
    <ContentModal
      open={open}
      onCancel={handleClose}
      title={NOTIFICATION_SEND_REQUEST_COMPLETED_TITLE}
      width={MODAL_WIDTH}
      zIndex={CMS_ALERT_MODAL_Z_INDEX}
      className="confirm-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={handleClose}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            onClick={handleViewHistory} >
            발송 이력 조회
          </CmsButton>
        </>
      }
    >
      <p className="confirm-modal__content">{NOTIFICATION_SEND_REQUEST_COMPLETED_MESSAGE}</p>
    </ContentModal>
  )
}
