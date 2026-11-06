import { useId } from 'react'
import { PLATFORM_SESSION_POLICY_DISPLAY } from '@jakorea/domain/session'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { usePortalSessionTimeout } from './use-portal-session-timeout'
import styles from './session-warning-modal.module.css'

/** 플랫폼 Figma 유휴 13772:86968 / 절대 13775:86982 — popup sm(440), 가운데 정렬, 가로 버튼 */
export function PlatformSessionWarningModal() {
  const titleId = useId()
  const descriptionId = useId()
  const { showWarning, warningKind, dismissWarning, extendIdleSession, logout } =
    usePortalSessionTimeout()

  if (!showWarning || warningKind == null) return null

  const isIdle = warningKind === 'idle'
  const copy = PLATFORM_SESSION_POLICY_DISPLAY

  return (
    <div data-session-warning-root="true">
      <PFModal
        open
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
        </div>
        <div className={styles.actions}>
          {isIdle ? (
            <>
              <PFButton
                className={styles.actionButton}
                variant="tertiary"
                size="xlarge"
                onClick={() => logout()}
              >
                {copy.idleLogoutLabel}
              </PFButton>
              <PFButton
                className={styles.actionButton}
                variant="primary"
                size="xlarge"
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
