import type { ReactNode } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './consent-withdraw-confirm.module.css'

type ConsentWithdrawConfirmProps = {
  open: boolean
  title: ReactNode
  description: ReactNode
  confirmLoading?: boolean
  /** 확인 버튼 기본 문구 기준 — `agree`: 동의하기 · `withdraw`: 철회하기 */
  mode?: 'withdraw' | 'agree'
  /** 확인 버튼 문구 — 기본값: `동의하기` / `철회하기` (mode 기준) */
  confirmLabel?: ReactNode
  /** 취소 버튼 문구 — 기본값: `취소` */
  cancelLabel?: ReactNode
  /**
   * 강조(primary) 버튼 — 기본값: `confirm`(시안 동의 철회 팝업: 취소=tertiary, 철회하기=primary).
   * `cancel`이면 취소 버튼을 강조한다(예: 수정 취소 확인의 「계속 수정하기」).
   */
  emphasis?: 'cancel' | 'confirm'
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
  emphasis = 'confirm',
  mobileFullPage = false,
  onCancel,
  onConfirm,
}: ConsentWithdrawConfirmProps) {
  const isAgree = mode === 'agree'
  const isCancelEmphasized = emphasis === 'cancel'
  return (
    <PFModal
      showCloseButton={false}
      open={open}
      size="md"
      onClose={() => {
        if (confirmLoading) return
        onCancel()
      }}
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
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.description}>
            {description}
          </PFText>
        </div>
        <div className={styles.actions}>
          {/* 처리 중에도 버튼 문구·모양은 그대로 두고 클릭만 막는다 (완료 전 화면 변화 없음) */}
          <PFButton
            type="button"
            variant={isCancelEmphasized ? 'primary' : 'tertiary'}
            size="xlarge"
            onClick={() => {
              if (confirmLoading) return
              onCancel()
            }}
          >
            {cancelLabel}
          </PFButton>
          <PFButton
            type="button"
            variant={isCancelEmphasized ? 'tertiary' : 'primary'}
            size="xlarge"
            aria-busy={confirmLoading || undefined}
            onClick={() => {
              if (confirmLoading) return
              onConfirm()
            }}
          >
            {confirmLabel ?? (isAgree ? '동의하기' : '철회하기')}
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
      showCloseButton={showCloseButton}
    >
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.description}>
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
