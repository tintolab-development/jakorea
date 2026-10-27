import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './lecture-report-submit-complete-modal.module.css'

type LectureReportSubmitCompleteModalProps = {
  open: boolean
  onLater: () => void
  onWritePaymentStatement: () => void
}

export function LectureReportSubmitCompleteModal({
  open,
  onLater,
  onWritePaymentStatement,
}: LectureReportSubmitCompleteModalProps) {
  return (
    <PFModal open={open} size="sm" onClose={onLater} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            강의보고서 제출이 완료되었어요.
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            강의비 지급을 위해 지급조서도 지금 작성할까요?
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            나중에 프로그램의 정산 현황 메뉴에서도 작성할 수 있어요.
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onLater}>
            나중에 하기
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onWritePaymentStatement}>
            지급조서 작성하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
