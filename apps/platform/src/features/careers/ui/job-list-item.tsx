import type { CareerJobListItem } from '../model/types'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './job-list-item.module.css'

export type JobListItemRowProps = {
  item: CareerJobListItem
}

function badgeVariant(status: CareerJobListItem['status']) {
  if (status === 'recruiting') {
    return 'primary' as const
  }
  if (status === 'result') {
    return 'deep' as const
  }
  return 'closed' as const
}

export function JobListItemRow({ item }: JobListItemRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <PFCategoryBadge size="small" variant={badgeVariant(item.status)} className={styles.badge}>
          {item.statusLabel}
        </PFCategoryBadge>
        <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
          {item.title}
        </PFText>
      </div>
      <PFText as="span" typo="bd-md-rg" color="neutral-cool-600" className={styles.date}>
        {item.publishedAtLabel}
      </PFText>
    </div>
  )
}
