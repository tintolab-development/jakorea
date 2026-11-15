/**
 * 시스템 안내 팝업 — 시안 「10. 자동발송 메일 및 시스템 안내 팝업」
 * (채용 공고 마감 안내 · 인재풀 신규 지원 안내 · 신규 기업후원 상담 신청 · 신규 재능기부 신청)
 * 알림 항목 클릭 → 읽음 처리 뒤 노출. 제목·본문·이동 버튼 문구는 서버 값(title·body·actionLabel)을 그대로 쓴다.
 */

import { CmsButton } from '@/shared/ui'
import { ContentModal } from '@/shared/ui/content-modal'
import type { HeaderNotification } from './notification-dropdown'
import './notification-detail-modal.css'

/** 헤더 알림 드롭다운(ant Dropdown 1050) 위 — CMS 알림 안내 팝업과 같은 층 */
export const NOTIFICATION_DETAIL_MODAL_Z_INDEX = 1100

export interface NotificationDetailModalProps {
  notification: HeaderNotification | null
  onClose: () => void
  onNavigate: (notification: HeaderNotification) => void
}

export function NotificationDetailModal({
  notification,
  onClose,
  onNavigate,
}: NotificationDetailModalProps) {
  const actionLabel = notification?.actionLabel?.trim()
  const canNavigate = Boolean(notification?.link && actionLabel)

  return (
    <ContentModal
      open={notification != null}
      onCancel={onClose}
      title={notification?.message ?? ''}
      width={600}
      zIndex={NOTIFICATION_DETAIL_MODAL_Z_INDEX}
      className="notification-detail-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="h40" onClick={onClose}>
            닫기
          </CmsButton>
          {notification && canNavigate ? (
            <CmsButton variant="primary" size="h40" onClick={() => onNavigate(notification)}>
              {actionLabel}
            </CmsButton>
          ) : null}
        </>
      }
    >
      {notification?.body ? (
        <p className="notification-detail-modal__body">{notification.body}</p>
      ) : null}
    </ContentModal>
  )
}
