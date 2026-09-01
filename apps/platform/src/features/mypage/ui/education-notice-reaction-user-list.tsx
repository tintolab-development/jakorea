import { useId } from 'react'
import { getReactionEmojiItemByType } from '@jakorea/ui'
import type {
  EducationNoticeReactionSummary,
  EducationNoticeReactionUser,
} from '../model/education-in-progress-notice-types'
import { PFText } from '@/shared/ui'
import styles from './education-notice-reaction-user-list.module.css'

type EducationNoticeReactionUserListProps = {
  reactions: EducationNoticeReactionSummary[]
  users: EducationNoticeReactionUser[]
  headerLimit?: number
  className?: string
}

export function EducationNoticeReactionUserList({
  reactions,
  users,
  headerLimit = 5,
  className,
}: EducationNoticeReactionUserListProps) {
  const clipBaseId = useId().replace(/:/g, '')
  const headerItems = reactions.slice(0, headerLimit)
  const hasMoreHeader = reactions.length > headerLimit
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <div className={styles.header} role="group" aria-label="이모지별 반응 수">
        {headerItems.map((reaction, index) => {
          const item = getReactionEmojiItemByType(reaction.emojiType)
          if (!item) return null
          return (
            <div key={reaction.emojiType} className={styles.headerStat}>
              <span className={styles.headerEmoji} aria-hidden>
                {item.renderIcon(`${clipBaseId}-h-${index}`)}
              </span>
              <PFText as="span" typo="bd-sm-md" className={styles.headerCount}>
                {reaction.count}
              </PFText>
            </div>
          )
        })}
        {hasMoreHeader ? (
          <PFText as="span" typo="bd-md-md" className={styles.ellipsis} aria-hidden>
            ...
          </PFText>
        ) : null}
      </div>

      <div className={styles.body}>
        {users.map((row, index) => {
          const item = getReactionEmojiItemByType(row.emojiType)
          if (!item) return null
          return (
            <div key={row.id} className={styles.row}>
              <span className={styles.rowEmoji} aria-hidden>
                {item.renderIcon(`${clipBaseId}-r-${index}`)}
              </span>
              <PFText as="span" typo="bd-sm-sb" color="black" className={styles.name}>
                {row.authorName}
              </PFText>
            </div>
          )
        })}
      </div>
    </div>
  )
}
