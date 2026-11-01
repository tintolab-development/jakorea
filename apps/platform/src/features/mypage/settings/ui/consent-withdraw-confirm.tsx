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
  /**
   * PC 미만에서 전체 화면(`PFModal` `mobilePlacement="full"`, 본문 스크롤·버튼 하단 고정) — 기본값: `false`.
   * 프로그램 신청 필수 동의 모달과 같은 패턴.
   */
  mobileFullPage?: boolean
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
  mobileFullPage = false,
  onCancel,
  onConfirm,
}: ConsentWithdrawConfirmProps) {
  const isAgree = mode === 'agree'
  return (
    <PFModal
      showCloseButton={false}
      open={open}
      size="md"
      onClose={onCancel}
      closeOnBackdropClick={!confirmLoading}
      mobilePlacement={mobileFullPage ? 'full' : undefined}
    >
      <div
        className={
          mobileFullPage ? `${styles.content} ${styles.contentMobileFullPage}` : styles.content
        }
      >
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
  /** 버튼 문구 — 기본값: `확인` */
  confirmLabel?: ReactNode
  /** 버튼 클릭 — 미지정 시 `onClose` */
  onConfirm?: () => void
  /** 우측 상단 닫기(X) 노출 — 기본값: `false` (하단 확인 버튼으로 닫음) */
  showCloseButton?: boolean
  onClose: () => void
}

export function ConsentWithdrawComplete({
  open,
  title,
  description,
  confirmLabel = '확인',
  onConfirm,
  showCloseButton = false,
  onClose,
}: ConsentWithdrawCompleteProps) {
  return (
    <PFModal
      open={open}
      size="md"
      onClose={onClose}
      closeOnBackdropClick
      showCloseButton={showCloseButton}
    >
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {description}
          </PFText>
        </div>
        <PFButton
          type="button"
          variant="primary"
          size="xlarge"
          width="100%"
          onClick={onConfirm ?? onClose}
        >
          {confirmLabel}
        </PFButton>
      </div>
    </PFModal>
  )
}
