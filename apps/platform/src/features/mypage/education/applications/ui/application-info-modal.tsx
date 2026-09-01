import { EducationApplicationContent } from './content'
import { PFModal } from '@/shared/ui'
import styles from './application-info-modal.module.css'

type EducationApplicationInfoModalProps = {
  open: boolean
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  onClose: () => void
}

export function EducationApplicationInfoModal({
  open,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  onClose,
}: EducationApplicationInfoModalProps) {
  return (
    <PFModal
      open={open}
      onClose={onClose}
      title="신청 정보"
      size="md"
      className={styles.modal}
      mobilePlacement="full"
    >
      <div className={styles.body}>
        <EducationApplicationContent
          selfIntroMotivation={selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
        />
      </div>
    </PFModal>
  )
}
