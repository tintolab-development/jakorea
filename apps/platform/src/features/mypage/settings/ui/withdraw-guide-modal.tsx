import { useId } from 'react'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import { SETTINGS_WITHDRAW_GUIDE } from '../lib/constants'
import styles from './withdraw-guide-modal.module.css'

export type SettingsWithdrawGuideModalProps = {
  open: boolean
  password: string
  passwordError?: string | null
  formError?: string | null
  confirmLoading?: boolean
  onClose: () => void
  onPasswordChange: (value: string) => void
  onConfirm: () => void
}

export function SettingsWithdrawGuideModal({
  open,
  password,
  passwordError,
  formError,
  confirmLoading = false,
  onClose,
  onPasswordChange,
  onConfirm,
}: SettingsWithdrawGuideModalProps) {
  const descriptionId = useId()
  const isBusy = confirmLoading

  return (
    <PFModal
      showCloseButton={false}
      open={open}
      size="md"
      title={SETTINGS_WITHDRAW_GUIDE.title}
      ariaDescribedBy={descriptionId}
      onClose={onClose}
      mobilePlacement="full"
      closeOnBackdropClick={!isBusy}
      closeOnEscape={!isBusy}
    >
      <div className={styles.content}>
        <PFText
          as="p"
          typo="bd-md-rg"
          color="neutral-cool-600"
          id={descriptionId}
          className={styles.description}
        >
          {SETTINGS_WITHDRAW_GUIDE.description}
        </PFText>

        <div className={styles.fields}>
          <PFTextInput
            size="xlarge"
            type="password"
            name="withdraw-current-password"
            placeholder={SETTINGS_WITHDRAW_GUIDE.passwordPlaceholder}
            autoComplete="current-password"
            autoFocus
            value={password}
            onValueChange={onPasswordChange}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onConfirm()
              }
            }}
            error={Boolean(passwordError)}
            message={passwordError ?? undefined}
            messageStatus="error"
            disabled={isBusy}
          />
          {formError ? (
            <PFText as="p" typo="bd-sm-md" color="error">
              {formError}
            </PFText>
          ) : null}
        </div>

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={isBusy}
            onClick={onClose}
          >
            {SETTINGS_WITHDRAW_GUIDE.cancelLabel}
          </PFButton>
          <PFButton
            type="button"
            variant="tertiary"
            size="xlarge"
            className={styles.dangerButton}
            disabled={isBusy}
            onClick={onConfirm}
          >
            {isBusy ? '처리 중…' : SETTINGS_WITHDRAW_GUIDE.confirmLabel}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
