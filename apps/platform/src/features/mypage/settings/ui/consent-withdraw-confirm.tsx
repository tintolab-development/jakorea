import type { ReactNode } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './consent-withdraw-confirm.module.css'

type ConsentWithdrawConfirmProps = {
  open: boolean
  title: ReactNode
  description: ReactNode
  confirmLoading?: boolean
  /** `agree` — 동의 확인(확인 버튼 강조) */
  mode?: 'withdraw' | 'agree'
  /** 확인 버튼 문구 — 기본값: `동의하기` / `철회하기` (mode 기준) */
  confirmLabel?: ReactNode
  /** 취소 버튼 문구 — 기본값: `취소` */
  cancelLabel?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConsentWithdrawConfirm({
  open,
  title,
  description,
  confirmLoading = false,
  mode = 'withdraw',
  confirmLabel,
  cancelLabel = '취소',
  onCancel,
  onConfirm,
}: ConsentWithdrawConfirmProps) {
  const isAgree = mode === 'agree'
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
            variant={isAgree ? 'tertiary' : 'primary'}
            size="xlarge"
            disabled={confirmLoading}
            onClick={onCancel}
          >
            {cancelLabel}
          </PFButton>
          <PFButton
            type="button"
            variant={isAgree ? 'primary' : 'tertiary'}
            size="xlarge"
            disabled={confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? '처리 중…' : (confirmLabel ?? (isAgree ? '동의하기' : '철회하기'))}
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
