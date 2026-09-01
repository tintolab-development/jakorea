import type { EducationInProgressNotice } from '../model/education-in-progress-notice-types'
import {
  formatEducationNoticePublishedAt,
  resolveEducationNoticeTitle,
} from '../lib/education-in-progress-notice-format'
import { PFText } from '@/shared/ui'
import { EducationNoticeStats } from './education-notice-stats'
import styles from './education-in-progress-notice-card.module.css'

type EducationInProgressNoticeCardProps = {
  notice: EducationInProgressNotice
  onClick?: () => void
}

export function EducationInProgressNoticeCard({
  notice,
  onClick,
}: EducationInProgressNoticeCardProps) {
  const title = resolveEducationNoticeTitle(notice.title, notice.content)
  const publishedAtLabel = formatEducationNoticePublishedAt(notice.publishedAt)

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.upper}>
        <PFText as="p" typo="hl-sm" color="black" className={styles.title}>
          {title}
        </PFText>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.preview}>
          {notice.content}
        </PFText>
      </div>

      <div className={styles.footer}>
        <div className={styles.authorBlock}>
          <PFText as="p" typo="bd-md-sb" color="black" className={styles.author}>
            {notice.authorName}
          </PFText>
          <div className={styles.dateRow}>
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.date}>
              {publishedAtLabel}
            </PFText>
            <span className={styles.dot} aria-hidden="true" />
            <PFText
              as="span"
              typo="bd-sm-sb"
              color={notice.read ? 'neutral-cool-500' : 'primary-500'}
              className={styles.readStatus}
            >
              {notice.read ? '읽음' : '안읽음'}
            </PFText>
          </div>
        </div>

        <EducationNoticeStats
          viewCount={notice.viewCount}
          commentCount={notice.commentCount}
          reactionCount={notice.reactionCount}
        />
      </div>
    </button>
  )
}
