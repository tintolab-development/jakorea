import type { ReactNode } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './assignment-feedback-modal.module.css'

type EducationAssignmentFeedbackModalProps = {
  open: boolean
  /** `2026년 04월 03일(금), 1차 교육` */
  sessionHeading: string
  body: ReactNode
  /** 수정 제출 가능할 때만 [수정 제출하기] 노출 */
  canRevise: boolean
  onClose: () => void
  onRevise: () => void
}

export function EducationAssignmentFeedbackModal({
  open,
  sessionHeading,
  body,
  canRevise,
  onClose,
  onRevise,
}: EducationAssignmentFeedbackModalProps) {
  return (
    <PFModal open={open} onClose={onClose} title="피드백 확인" size="md" showCloseButton={false}>
      <PFText as="p" typo="bd-md-rg" color="black" className={styles.guide}>
        담당자의 피드백을 확인 후, 과제를 수정 제출 또는 다음 과제에 반영해 주세요.
      </PFText>
      <div className={styles.content}>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.heading}>
          {sessionHeading}
        </PFText>
        <PFText as="div" typo="bd-md-md" color="black" className={styles.body}>
          {body}
        </PFText>
      </div>
      <div className={styles.actions}>
        <PFButton type="button" variant="tertiary" size="xlarge" width={160} onClick={onClose}>
          닫기
        </PFButton>
        {canRevise ? (
          <PFButton type="button" variant="primary" size="xlarge" width={160} onClick={onRevise}>
            수정 제출하기
          </PFButton>
        ) : null}
      </div>
    </PFModal>
  )
}
