import type { KeyboardEvent } from 'react'
import type { ProgramListItem } from '../model/types'
import { PFArrowButton, PFText } from '@/shared/ui'
import { ProgramStatusBadges } from './program-status-badges'
import styles from './list-item.module.css'

type ProgramListItemRowProps = {
  program: ProgramListItem
  onClick: () => void
}

export function ProgramListItemRow({ program, onClick }: ProgramListItemRowProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.thumbnailWrap}>
        <img className={styles.thumbnail} src={program.thumbnailUrl} alt="" />
      </div>

      <div className={styles.content}>
        <div className={styles.info}>
          <PFText as="span" typo="bd-lg-sb" color="black">
            {program.categoryLabel}
          </PFText>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            {program.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="primary-500">
            {program.operatingPeriodLabel}
          </PFText>
        </div>

        <ProgramStatusBadges
          recruitmentStatus={program.recruitmentStatus}
          educationTargetLabel={program.educationTargetLabel}
          educationForm={program.educationForm}
          educationFormLabel={program.educationFormLabel}
        />
      </div>

      <div className={styles.recruitmentAside}>
        <div className={styles.recruitment}>
          <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
            모집기간
          </PFText>
          <PFText as="span" typo="bd-lg-sb" color="black">
            {program.recruitmentPeriodLabel}
          </PFText>
        </div>

        <PFArrowButton variant="primary" size="medium" decorative />
      </div>
    </div>
  )
}
