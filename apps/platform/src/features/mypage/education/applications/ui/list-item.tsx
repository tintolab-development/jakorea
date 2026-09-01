import type { EducationApplicationListItem } from '../model/types'
import { ProgramStatusBadges } from '@/features/program/ui/program-status-badges'
import { MediaListRow } from '@/shared/ui/media-list-row'
import { PFText } from '@/shared/ui'
import {
  EDUCATION_DISPLAY_STATUS_TONE_CLASS,
  getEducationDisplayStatusLabel,
  getEducationDisplayStatusTone,
} from '../lib/display-status'
import styles from './list-item.module.css'

type EducationApplicationListItemRowProps = {
  item: EducationApplicationListItem
  onClick: () => void
}

export function EducationApplicationListItemRow({
  item,
  onClick,
}: EducationApplicationListItemRowProps) {
  const statusTone = getEducationDisplayStatusTone(item.displayStatus)
  const statusToneClass = styles[EDUCATION_DISPLAY_STATUS_TONE_CLASS[statusTone]]
  const statusLabel = getEducationDisplayStatusLabel(item.displayStatus)

  return (
    <MediaListRow
      thumbnailUrl={item.thumbnailUrl}
      interactive
      onClick={onClick}
      content={
        <>
          <div className={styles.info}>
            <PFText as="span" typo="bd-lg-sb" color="black">
              {item.categoryLabel}
            </PFText>
            <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
              {item.title}
            </PFText>
            <p className={styles.periodLine}>
              <PFText as="span" typo="bd-md-md" color="primary-700">
                모집기간
              </PFText>
              <PFText as="span" typo="bd-md-md" color="primary-500">
                {item.recruitmentPeriodLabel}
              </PFText>
            </p>
            <p className={styles.periodLine}>
              <PFText as="span" typo="bd-md-md" color="primary-700">
                진행기간
              </PFText>
              <PFText as="span" typo="bd-md-md" color="primary-500">
                {item.operatingPeriodLabel}
              </PFText>
            </p>
          </div>

          <ProgramStatusBadges
            recruitmentStatus={item.recruitmentStatus}
            educationTargetLabel={item.educationTargetLabel}
            educationForm={item.educationForm}
            educationFormLabel={item.educationFormLabel}
          />
        </>
      }
      aside={
        <PFText as="span" typo="bd-lg-sb" className={[styles.status, statusToneClass].join(' ')}>
          {statusLabel}
        </PFText>
      }
    />
  )
}
