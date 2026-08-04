import type { ResultListItem } from '../model/types'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './list-item.module.css'

type ResultListItemRowProps = {
  item: ResultListItem
  onClick: () => void
}

export function ResultListItemRow({ item, onClick }: ResultListItemRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <PFCategoryBadge size="small" variant="secondary" className={styles.badge}>
        {item.categoryName}
      </PFCategoryBadge>

      <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
        {item.title}
      </PFText>

      <PFText as="span" typo="bd-md-rg" color="neutral-cool-600" className={styles.date}>
        {item.announcedAtLabel}
      </PFText>
    </button>
  )
}
