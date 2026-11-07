import { useId } from 'react'
import { PLATFORM_SESSION_POLICY_DISPLAY } from '@jakorea/domain/session'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { usePortalSessionTimeout } from './use-portal-session-timeout'
import styles from './session-warning-modal.module.css'

/** portal로 렌더되는 모달 DOM도 Activity 수집에서 제외되도록 backdrop 루트에 표시한다. */
const SESSION_WARNING_ROOT_ATTRIBUTES = { 'data-session-warning-root': 'true' } as const

/** 플랫폼 Figma 유휴 13772:86968 / 절대 13775:86982 — popup sm(440), 가운데 정렬, 가로 버튼 */
export function PlatformSessionWarningModal() {
  const titleId = useId()
  const descriptionId = useId()
  const {
    showWarning,
    warningKind,
    extending,
    extendError,
    dismissWarning,
    extendIdleSession,
    logout,
  } = usePortalSessionTimeout()

  if (!showWarning || warningKind == null) return null

  const isIdle = warningKind === 'idle'
  const copy = PLATFORM_SESSION_POLICY_DISPLAY

  return (
    <div data-session-warning-root="true">
      <PFModal
        open
        backdropDataAttributes={SESSION_WARNING_ROOT_ATTRIBUTES}
        onClose={isIdle ? () => undefined : dismissWarning}
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
            {isIdle ? copy.idleTitle : copy.absoluteTitle}
          </PFText>
          <PFText
            as="p"
            typo="bd-md-rg"
            color="neutral-warm-600"
            id={descriptionId}
            className={styles.description}
          >
            {isIdle ? copy.idleBody : copy.absoluteBody}
          </PFText>
          {isIdle && extendError ? (
            <PFText
              as="p"
              typo="bd-sm-md"
              color="error"
              role="alert"
              className={styles.error}
            >
              {extendError}
            </PFText>
          ) : null}
        </div>
        <div className={styles.actions}>
          {isIdle ? (
            <>
              <PFButton
                className={styles.actionButton}
                variant="tertiary"
                size="xlarge"
                disabled={extending}
                onClick={() => logout()}
              >
                {copy.idleLogoutLabel}
              </PFButton>
              <PFButton
                className={styles.actionButton}
                variant="primary"
                size="xlarge"
                disabled={extending}
                aria-busy={extending}
                onClick={() => void extendIdleSession()}
              >
                {copy.idleExtendLabel}
              </PFButton>
            </>
          ) : (
            <PFButton
              className={styles.actionButton}
              variant="tertiary"
              size="xlarge"
              onClick={dismissWarning}
            >
              {copy.absoluteConfirmLabel}
            </PFButton>
          )}
        </div>
      </PFModal>
    </div>
  )
}
