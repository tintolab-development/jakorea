/**
 * 알림 안내 팝업 — 시안 Figma CMS 「시스템 안내 팝업」 › 공통_ 3종 (600 폭)
 * 제목(좌) + 닫기 X · 본문 · [닫기] + 이동 버튼(우측 정렬). 이동 위치가 없으면 [닫기]만.
 */

import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { PortalNotificationPopup } from '../lib/resolve-portal-notification-popup'
import styles from './notification-popup.module.css'

type NotificationPopupProps = {
  popup: PortalNotificationPopup | null
  onClose: () => void
}

export function NotificationPopup({ popup, onClose }: NotificationPopupProps) {
  const navigate = useNavigate()
  const titleId = useId()

  return (
    <PFModal open={popup != null} onClose={onClose} size="md" ariaLabelledBy={titleId}>
      {popup ? (
        <div className={styles.content}>
          <PFText as="h2" id={titleId} typo="hl-lg" color="black" className={styles.title}>
            {popup.title}
          </PFText>
          {popup.message ? (
            <PFText as="p" typo="bd-md-md" color="black" className={styles.message}>
              {popup.message}
            </PFText>
          ) : null}
          <div className={styles.actions}>
            <PFButton type="button" variant="secondary" size="large" onClick={onClose}>
              닫기
            </PFButton>
            {popup.path && popup.actionLabel ? (
              <PFButton
                type="button"
                variant="primary"
                size="large"
                onClick={() => {
                  const path = popup.path
                  onClose()
                  if (path) navigate(path)
                }}
              >
                {popup.actionLabel}
              </PFButton>
            ) : null}
          </div>
        </div>
      ) : null}
    </PFModal>
  )
}
