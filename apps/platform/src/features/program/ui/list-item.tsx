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
  const hasThumbnailImage = Boolean(program.thumbnailUrl?.trim())
  const isClosed = program.recruitmentStatus === 'closed'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={[styles.row, isClosed ? styles.rowClosed : null].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className={[
          styles.thumbnailWrap,
          hasThumbnailImage ? styles.thumbnailWrapHasImage : styles.thumbnailWrapNoImage,
        ].join(' ')}
      >
        {hasThumbnailImage ? (
          <img className={styles.thumbnail} src={program.thumbnailUrl} alt="" />
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.info}>
          <PFText as="span" typo="bd-lg-sb" color={isClosed ? 'neutral-cool-500' : 'black'}>
            {program.categoryLabel}
          </PFText>
          <PFText
            as="h2"
            typo="hl-lg"
            color={isClosed ? 'neutral-cool-500' : 'black'}
            className={styles.title}
          >
            {program.title}
          </PFText>
          <p className={styles.operatingPeriod}>
            <PFText as="span" typo="bd-md-md" color={isClosed ? 'neutral-cool-500' : 'primary-500'}>
              {program.operatingPeriodLabel}
            </PFText>
          </p>
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
          <PFText as="span" typo="bd-lg-sb" color={isClosed ? 'neutral-cool-500' : 'black'}>
            {program.recruitmentPeriodLabel}
          </PFText>
        </div>

        <PFArrowButton
          variant="primary"
          size="medium"
          decorative
          disabled={isClosed}
        />
      </div>
    </div>
  )
}
