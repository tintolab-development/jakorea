import type { ReactNode } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries } from '@/shared/lib'
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
   * PC 미만에서 하단 시트(`PFModal` `mobilePlacement="bottom"`, 핸들 표시·닫기(X) 숨김) — 기본값: `false`.
   * 프로그램 신청 필수 동의 모달과 같은 패턴.
   */
  mobileBottomSheet?: boolean
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
  mobileBottomSheet = false,
  onCancel,
  onConfirm,
}: ConsentWithdrawConfirmProps) {
  const isAgree = mode === 'agree'
  // 하단 시트(PC 미만)에서만 닫기(X)를 숨긴다. PC 팝업은 기존과 같다.
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)
  return (
    <PFModal
      open={open}
      size="md"
      onClose={onCancel}
      closeOnBackdropClick={!confirmLoading}
      mobilePlacement={mobileBottomSheet ? 'bottom' : undefined}
      showCloseButton={!(mobileBottomSheet && isBelowPc)}
    >
      <div
        className={
          mobileBottomSheet ? `${styles.content} ${styles.contentMobileBottomSheet}` : styles.content
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
  /** 우측 상단 닫기(X) 노출 — 기본값: `true` */
  showCloseButton?: boolean
  onClose: () => void
}

export function ConsentWithdrawComplete({
  open,
  title,
  description,
  confirmLabel = '확인',
  onConfirm,
  showCloseButton = true,
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
