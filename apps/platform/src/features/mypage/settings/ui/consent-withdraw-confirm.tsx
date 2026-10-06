import type { ReactNode } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './consent-withdraw-confirm.module.css'

type ConsentWithdrawConfirmProps = {
  open: boolean
  title: ReactNode
  description: ReactNode
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConsentWithdrawConfirm({
  open,
  title,
  description,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: ConsentWithdrawConfirmProps) {
  return (
    <PFModal open={open} size="md" onClose={onCancel} closeOnBackdropClick={!confirmLoading}>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {description}
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={confirmLoading}
            onClick={onCancel}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="tertiary"
            size="xlarge"
            disabled={confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? '처리 중…' : '철회하기'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}

type ConsentWithdrawCompleteProps = {
  open: boolean
  title: ReactNode
  description: ReactNode
  onClose: () => void
}

export function ConsentWithdrawComplete({
  open,
  title,
  description,
  onClose,
}: ConsentWithdrawCompleteProps) {
  return (
    <PFModal open={open} size="md" onClose={onClose} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {description}
          </PFText>
        </div>
        <PFButton type="button" variant="primary" size="xlarge" width="100%" onClick={onClose}>
          확인
        </PFButton>
      </div>
    </PFModal>
  )
}
