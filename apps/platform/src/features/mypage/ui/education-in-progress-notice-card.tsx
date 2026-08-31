import type { EducationInProgressNotice } from '../model/education-in-progress-notice-types'
import {
  formatEducationNoticePublishedAt,
  resolveEducationNoticeTitle,
} from '../lib/education-in-progress-notice-format'
import noticeMetaCommentUrl from '../assets/icon/notice-meta-comment.svg'
import noticeMetaEyeUrl from '../assets/icon/notice-meta-eye.svg'
import noticeMetaReactionUrl from '../assets/icon/notice-meta-reaction.svg'
import { PFText } from '@/shared/ui'
import styles from './education-in-progress-notice-card.module.css'

type EducationInProgressNoticeCardProps = {
  notice: EducationInProgressNotice
}

export function EducationInProgressNoticeCard({ notice }: EducationInProgressNoticeCardProps) {
  const title = resolveEducationNoticeTitle(notice.title, notice.content)
  const publishedAtLabel = formatEducationNoticePublishedAt(notice.publishedAt)

  return (
    <article className={styles.card}>
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

        <div className={styles.stats} aria-label="조회·댓글·반응">
          <span className={styles.stat}>
            <img className={styles.statIcon} src={noticeMetaEyeUrl} alt="" aria-hidden="true" />
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.statCount}>
              {notice.viewCount}
            </PFText>
          </span>
          <span className={styles.stat}>
            <img className={styles.statIcon} src={noticeMetaCommentUrl} alt="" aria-hidden="true" />
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.statCount}>
              {notice.commentCount}
            </PFText>
          </span>
          <span className={styles.stat}>
            <img className={styles.statIcon} src={noticeMetaReactionUrl} alt="" aria-hidden="true" />
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.statCount}>
              {notice.reactionCount}
            </PFText>
          </span>
        </div>
      </div>
    </article>
  )
}
