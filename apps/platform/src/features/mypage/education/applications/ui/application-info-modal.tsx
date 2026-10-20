import type { ReactNode } from 'react'
import { EducationApplicationContent } from './content'
import { PFModal } from '@/shared/ui'
import styles from './application-info-modal.module.css'

type EducationApplicationInfoModalProps = {
  open: boolean
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  preferredEducationScheduleLines?: readonly string[]
  alwaysShowPreferredSchedule?: boolean
  /** 교사·기관 등 — 신청 내용 탭과 동일 본문(기관 정보·안내사항·신청 일정) */
  applicationBody?: ReactNode
  onClose: () => void
}

export function EducationApplicationInfoModal({
  open,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  preferredEducationScheduleLines,
  alwaysShowPreferredSchedule,
  applicationBody,
  onClose,
}: EducationApplicationInfoModalProps) {
  return (
    <PFModal
      open={open}
      onClose={onClose}
      title="신청 정보"
      size="lg"
      className={styles.modal}
      mobilePlacement="full"
    >
      <div className={styles.body}>
        {applicationBody ?? (
          <EducationApplicationContent
            selfIntroMotivation={selfIntroMotivation}
            preferredEducationScheduleLabel={preferredEducationScheduleLabel}
            preferredEducationScheduleLines={preferredEducationScheduleLines}
            alwaysShowPreferredSchedule={alwaysShowPreferredSchedule}
          />
        )}
      </div>
    </PFModal>
  )
}
