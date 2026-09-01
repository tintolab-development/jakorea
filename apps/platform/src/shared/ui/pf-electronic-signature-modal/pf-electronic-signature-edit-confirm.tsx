import { PFButton } from '../pf-button'
import { PFModal } from '../pf-modal'
import { PFText } from '../pf-text'
import styles from './pf-electronic-signature-edit-confirm.module.css'
import type { PFElectronicSignatureEditConfirmProps } from './types'

export function PFElectronicSignatureEditConfirm({
  open,
  onCancel,
  onConfirm,
}: PFElectronicSignatureEditConfirmProps) {
  return (
    <PFModal open={open} size="sm" onClose={onCancel} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            전자서명을 수정하시겠습니까?
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            전자서명을 수정하면 해당 동의서의 모든 서명이 취소되며 다시 서명해야 합니다.
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onCancel}>
            취소
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onConfirm}>
            전자서명 수정하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
