import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './education-cancel-confirm.module.css'

type EducationNoticeDeleteConfirmProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function EducationNoticeDeleteConfirm({
  open,
  onCancel,
  onConfirm,
}: EducationNoticeDeleteConfirmProps) {
  return (
    <PFModal open={open} size="sm" onClose={onCancel} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            안내사항을 삭제할까요?
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            삭제한 안내사항은 다시 확인하기 어려워요.
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="tertiary" size="xlarge" onClick={onCancel}>
            취소
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onConfirm}>
            삭제하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
