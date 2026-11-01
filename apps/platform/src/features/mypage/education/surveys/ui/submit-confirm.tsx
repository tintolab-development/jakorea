import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { EducationSurveySeedKind } from '../lib/seed-survey-draft'
import { educationSurveySubmitConfirmCopy } from '../lib/submit-confirm-copy'
import styles from './submit-confirm.module.css'

type EducationSurveySubmitConfirmProps = {
  open: boolean
  kind: EducationSurveySeedKind
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function EducationSurveySubmitConfirm({
  open,
  kind,
  pending = false,
  onCancel,
  onConfirm,
}: EducationSurveySubmitConfirmProps) {
  const copy = educationSurveySubmitConfirmCopy(kind)

  return (
    <PFModal
      open={open}
      size="sm"
      onClose={onCancel}
      closeOnBackdropClick={!pending}
      closeOnEscape={!pending}
      showCloseButton={false}
    >
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {copy.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {copy.description}
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            onClick={onCancel}
            disabled={pending}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? '제출 중...' : '제출하기'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
