/**
 * 알림 안내 팝업 (시안 12197:393141 「[JA Korea] 프로그램 신규 신청자 안내」)
 * 알림 항목 클릭 → 읽음 처리 뒤 노출. 제목 = 알림 제목, [프로그램명], 본문, [닫기] + 이동 버튼(대상 있을 때).
 */

import type { Notification } from '../api/notification-service'
import { resolveAdminNotificationActionLabel } from '../lib/admin-notification-action-label'
import { CmsButton } from '@/shared/ui'
import { ContentModal } from '@/shared/ui/content-modal'
import './notification-detail-modal.css'

/** 헤더 알림 드롭다운(ant Dropdown 1050) 위, 풀페이지 상세(1100)와 같은 층 */
export const NOTIFICATION_DETAIL_MODAL_Z_INDEX = 1100

export interface NotificationDetailModalProps {
  notification: Notification | null
  onClose: () => void
  onNavigate: (notification: Notification) => void
}

export function NotificationDetailModal({
  notification,
  onClose,
  onNavigate,
}: NotificationDetailModalProps) {
  const actionLabel = notification ? resolveAdminNotificationActionLabel(notification) : null
  const programName = notification?.programName?.trim()

  return (
    <ContentModal
      open={notification != null}
      onCancel={onClose}
      title={notification?.title ?? ''}
      width={600}
      zIndex={NOTIFICATION_DETAIL_MODAL_Z_INDEX}
      className="notification-detail-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="h40" onClick={onClose}>
            닫기
          </CmsButton>
          {notification && actionLabel ? (
            <CmsButton variant="primary" size="h40" onClick={() => onNavigate(notification)}>
              {actionLabel}
            </CmsButton>
          ) : null}
        </>
      }
    >
      {programName ? <p className="notification-detail-modal__program">[{programName}]</p> : null}
      <p className="notification-detail-modal__body">{notification?.body}</p>
    </ContentModal>
  )
}
