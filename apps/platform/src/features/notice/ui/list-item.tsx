import type { NoticeListItem } from '../model/types'
import { PFStateBadge, PFText } from '@/shared/ui'
import styles from './list-item.module.css'

type NoticeListItemRowProps = {
  item: NoticeListItem
  onClick: () => void
}

export function NoticeListItemRow({ item, onClick }: NoticeListItemRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <PFText as="span" typo="bd-md-rg" color="neutral-cool-500" className={styles.no}>
        {item.no}
      </PFText>

      <div className={styles.titleGroup}>
        {item.isPinned ? (
          <PFStateBadge size="small" tone="progress" className={styles.badge}>
            공지
          </PFStateBadge>
        ) : null}
        <PFText
          as="span"
          typo={item.isPinned ? 'bd-lg-sb' : 'bd-lg-rg'}
          color="black"
          className={styles.title}
        >
          {item.title}
        </PFText>
      </div>

      <PFText as="span" typo="bd-md-rg" color="neutral-cool-500" className={styles.date}>
        {item.publishedAtLabel}
      </PFText>
    </button>
  )
}
