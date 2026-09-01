import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './education-cancel-confirm.module.css'

type EducationCancelConfirmProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function EducationCancelConfirm({ open, onCancel, onConfirm }: EducationCancelConfirmProps) {
  return (
    <PFModal open={open} size="sm" onClose={onCancel} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            신청을 취소하시겠습니까?
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            신청을 취소하면 신청 이력이 남지 않습니다.
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onCancel}>
            닫기
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onConfirm}>
            신청 취소하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
