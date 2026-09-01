import noticeIconCommentUrl from '../assets/icon/notice-icon-comment.svg'
import noticeIconEmojiUrl from '../assets/icon/notice-icon-emoji.svg'
import noticeIconEyeUrl from '../assets/icon/notice-icon-eye.svg'
import { PFText } from '@/shared/ui'
import styles from './education-notice-stats.module.css'

type EducationNoticeStatsProps = {
  viewCount: number
  commentCount: number
  reactionCount: number
  className?: string
  onReactionClick?: () => void
  reactionExpanded?: boolean
  onCommentClick?: () => void
  commentExpanded?: boolean
}

export function EducationNoticeStats({
  viewCount,
  commentCount,
  reactionCount,
  className,
  onReactionClick,
  reactionExpanded = false,
  onCommentClick,
  commentExpanded = false,
}: EducationNoticeStatsProps) {
  const rootClassName = [styles.stats, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName} aria-label="조회·댓글·반응">
      <span className={styles.stat}>
        <img className={styles.statIcon} src={noticeIconEyeUrl} alt="" aria-hidden="true" />
        <PFText as="span" typo="bd-sm-md" className={styles.statCount}>
          {viewCount}
        </PFText>
      </span>
      {onCommentClick ? (
        <button
          type="button"
          className={[styles.stat, styles.statButton].join(' ')}
          aria-label="댓글 목록"
          aria-expanded={commentExpanded}
          onClick={onCommentClick}
        >
          <img className={styles.statIcon} src={noticeIconCommentUrl} alt="" aria-hidden="true" />
          <PFText as="span" typo="bd-sm-md" className={styles.statCount}>
            {commentCount}
          </PFText>
        </button>
      ) : (
        <span className={styles.stat}>
          <img className={styles.statIcon} src={noticeIconCommentUrl} alt="" aria-hidden="true" />
          <PFText as="span" typo="bd-sm-md" className={styles.statCount}>
            {commentCount}
          </PFText>
        </span>
      )}
      {onReactionClick ? (
        <button
          type="button"
          className={[styles.stat, styles.statButton].join(' ')}
          aria-label="반응한 사람 목록"
          aria-expanded={reactionExpanded}
          onClick={onReactionClick}
        >
          <img className={styles.statIcon} src={noticeIconEmojiUrl} alt="" aria-hidden="true" />
          <PFText as="span" typo="bd-sm-md" className={styles.statCount}>
            {reactionCount}
          </PFText>
        </button>
      ) : (
        <span className={styles.stat}>
          <img className={styles.statIcon} src={noticeIconEmojiUrl} alt="" aria-hidden="true" />
          <PFText as="span" typo="bd-sm-md" className={styles.statCount}>
            {reactionCount}
          </PFText>
        </span>
      )}
    </div>
  )
}
