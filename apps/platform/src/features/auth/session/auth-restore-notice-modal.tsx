import { useId, useState, useSyncExternalStore } from 'react'
import { retryPortalAccessTokenRestore } from '@/shared/api/axios-instance'
import {
  buildSignInPathWithRedirect,
  dismissAuthRestoreNotice,
  getAuthRestoreNotice,
  resolveAuthRestoreNoticeActions,
  subscribeAuthRestoreNotice,
  type AuthRestoreNoticeAction,
} from '@/shared/lib/auth-restore-notice'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY } from './auth-restore-notice-display'
import styles from './session-warning-modal.module.css'

/** 세션 경고 모달과 같이 portal DOM도 Activity 수집에서 제외한다 */
const AUTH_RESTORE_NOTICE_ROOT_ATTRIBUTES = { 'data-session-warning-root': 'true' } as const

const getServerSnapshot = () => null

type PlatformAuthRestoreNoticeModalProps = {
  /** 현재 라우터 위치 (pathname + search). 로그인 화면이면 세션 종료 안내를 [확인]만 둔다 */
  currentPath: string
  /** SPA 이동 */
  navigate: (to: string) => void
}

/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내.
 * 세션 경고 모달(popup sm 440, 가운데 정렬, 가로 버튼) 틀을 그대로 쓴다.
 */
export function PlatformAuthRestoreNoticeModal({
  currentPath,
  navigate,
}: PlatformAuthRestoreNoticeModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const notice = useSyncExternalStore(
    subscribeAuthRestoreNotice,
    getAuthRestoreNotice,
    getServerSnapshot,
  )
  const [retrying, setRetrying] = useState(false)

  if (notice == null) return null

  const copy = PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY
  const pathname = currentPath.split('?')[0] ?? currentPath
  const actions = resolveAuthRestoreNoticeActions(notice, pathname)
  const isSessionEnded = notice === 'session-ended'

  const handleRetry = async () => {
    setRetrying(true)
    try {
      // 성공하면 setAuthTokens가 안내를 닫고, 세션 무효면 '로그인 종료' 안내로 바뀐다. 그 외 실패는 안내를 유지한다.
      await retryPortalAccessTokenRestore()
    } finally {
      setRetrying(false)
    }
  }

  const handleAction = (action: AuthRestoreNoticeAction) => {
    switch (action) {
      case 'close':
      case 'confirm':
        dismissAuthRestoreNotice()
        return
      case 'sign-in':
        dismissAuthRestoreNotice()
        navigate(buildSignInPathWithRedirect(currentPath))
        return
      case 'retry':
        void handleRetry()
        return
    }
  }

  const labelOf = (action: AuthRestoreNoticeAction) => {
    switch (action) {
      case 'close':
        return copy.closeLabel
      case 'confirm':
        return copy.confirmLabel
      case 'sign-in':
        return copy.signInLabel
      case 'retry':
        return copy.retryLabel
    }
  }

  return (
    <div data-session-warning-root="true">
      <PFModal
        open
        backdropDataAttributes={AUTH_RESTORE_NOTICE_ROOT_ATTRIBUTES}
        onClose={() => undefined}
        showCloseButton={false}
        closeOnBackdropClick={false}
        closeOnEscape={false}
        size="sm"
        ariaLabelledBy={titleId}
        ariaDescribedBy={descriptionId}
        className={styles.panel}
      >
        <div className={styles.head}>
          <PFText as="div" typo="hl-lg" color="black" id={titleId} className={styles.title}>
            {isSessionEnded ? copy.sessionEndedTitle : copy.unavailableTitle}
          </PFText>
          <PFText
            as="p"
            typo="bd-md-rg"
            color="neutral-warm-600"
            id={descriptionId}
            className={styles.description}
          >
            {isSessionEnded ? copy.sessionEndedBody : copy.unavailableBody}
          </PFText>
        </div>
        <div className={styles.actions}>
          {actions.map(action => {
            const isPrimary = action === 'sign-in' || action === 'retry'
            return (
              <PFButton
                key={action}
                className={styles.actionButton}
                variant={isPrimary ? 'primary' : 'tertiary'}
                size="xlarge"
                disabled={retrying}
                aria-busy={action === 'retry' ? retrying : undefined}
                onClick={() => handleAction(action)}
              >
                {labelOf(action)}
              </PFButton>
            )
          })}
        </div>
      </PFModal>
    </div>
  )
}
