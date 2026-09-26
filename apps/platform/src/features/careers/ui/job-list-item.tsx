import type { CareerJobListItem } from '../model/types'
import { careerJobBadgeVariant } from '../lib/badge-variant'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './job-list-item.module.css'

export type JobListItemRowProps = {
  item: CareerJobListItem
  onClick: () => void
}

export function JobListItemRow({ item, onClick }: JobListItemRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <div className={styles.main}>
        <PFCategoryBadge
          size="small"
          variant={careerJobBadgeVariant(item.status)}
          className={styles.badge}
        >
          {item.statusLabel}
        </PFCategoryBadge>
        <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
          {item.title}
        </PFText>
      </div>
      <PFText as="span" typo="bd-md-rg" color="neutral-cool-600" className={styles.date}>
        {item.publishedAtLabel}
      </PFText>
    </button>
  )
}
