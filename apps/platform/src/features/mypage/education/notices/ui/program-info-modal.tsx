import { ProgramInfoDetail, type ProgramDetail } from '@/features/program'
import { PFFileDownload, PFModal } from '@/shared/ui'
import styles from './program-info-modal.module.css'

type EducationProgramInfoModalProps = {
  open: boolean
  program: ProgramDetail
  onClose: () => void
}

export function EducationProgramInfoModal({
  open,
  program,
  onClose,
}: EducationProgramInfoModalProps) {
  return (
    <PFModal
      open={open}
      onClose={onClose}
      title="프로그램 정보"
      size="lg"
      className={styles.modal}
      mobilePlacement="full"
    >
      <div className={styles.body}>
        <ProgramInfoDetail
          program={program}
          showPeriodSponsor
          className={styles.detail}
        />

        {program.attachments.length > 0 ? (
          <ul className={styles.attachments}>
            {program.attachments.map(attachment => (
              <li key={attachment.name}>
                <PFFileDownload fileName={attachment.name} href={attachment.url} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </PFModal>
  )
}
