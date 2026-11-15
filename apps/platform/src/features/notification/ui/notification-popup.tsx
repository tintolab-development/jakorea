/**
 * 알림 안내 팝업 — 시안 Figma 사용자 플랫폼 「시스템 안내 팝업」 (600 폭, 예: 사용자_강사_배정_취소 14601:81917)
 * 제목(좌) + 닫기 X · [프로그램명](있을 때만) · 본문 · 사유 상자(있을 때만) · [닫기] + 이동 버튼(우측 정렬).
 * 이동 위치가 없으면 [닫기]만.
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
          {popup.programName ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500" className={styles.programName}>
              [{popup.programName}]
            </PFText>
          ) : null}
          {popup.message ? (
            <PFText as="p" typo="bd-md-md" color="black" className={styles.message}>
              {popup.message}
            </PFText>
          ) : null}
          {popup.reason ? (
            <div className={styles.reason}>
              <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500" className={styles.reasonLabel}>
                {popup.reason.label}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="black" className={styles.reasonText}>
                {popup.reason.text}
              </PFText>
            </div>
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
