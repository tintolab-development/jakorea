import { ProgramInfoDetail, type ProgramDetail } from '@/features/program'
import { PFFileDownload, PFModal, PFText } from '@/shared/ui'
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
  const operatingPeriodLabel = program.operatingPeriodLabel.trim()
  const sponsor = program.sponsor.trim()
  const hasPeriod = operatingPeriodLabel.length > 0 && operatingPeriodLabel !== '-'
  const hasSponsor = sponsor.length > 0 && sponsor !== '-'

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
        {hasPeriod || hasSponsor ? (
          <div className={styles.meta}>
            {hasPeriod ? (
              <div className={styles.metaItem}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                  프로그램 운영 기간
                </PFText>
                <PFText as="span" typo="hl-sm" color="black">
                  {operatingPeriodLabel}
                </PFText>
              </div>
            ) : null}
            {hasSponsor ? (
              <div className={styles.metaItem}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                  후원사
                </PFText>
                <PFText as="span" typo="hl-sm" color="black">
                  {sponsor}
                </PFText>
              </div>
            ) : null}
          </div>
        ) : null}

        <ProgramInfoDetail program={program} className={styles.detail} />

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
