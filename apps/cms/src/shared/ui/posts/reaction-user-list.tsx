/**
 * 게시글 반응(이모지) 상세 목록 — 헤더 집계 + 사용자 행
 * PostDetailModal Popover 본문 Current
 */

import { useId } from 'react'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import { truncateDisplayNameForList } from '@/shared/lib/truncate-display-name'
import { getReactionEmojiItemByType } from './reaction-emoji-icons'
import './reaction-user-list.css'

export type ReactionUserListSummaryItem = {
  emojiType: string
  count: number
}

export type ReactionUserListRow = {
  id: string
  authorName: string
  roleLabel: string
  emojiType: string
}

export interface ReactionUserListProps {
  reactions: ReactionUserListSummaryItem[]
  users: ReactionUserListRow[]
  /** 본인 행 판별용 표시명 */
  currentUserName?: string
  /** 본인 행 판별용 역할 라벨 */
  currentUserRoleLabel?: string
  /** 본인 반응 취소 */
  onRemoveOwnReaction?: (rowId: string) => void
  className?: string
  /** 헤더에 보여줄 이모지 종류 상한 (기본 5, 초과 시 …) */
  headerLimit?: number
}

function isCurrentUserRow(
  row: ReactionUserListRow,
  displayName: string,
  roleLabel: string
): boolean {
  return (
    row.authorName.trim() === displayName.trim() &&
    row.roleLabel.trim() === roleLabel.trim()
  )
}

export function ReactionUserList({
  reactions,
  users,
  currentUserName = '',
  currentUserRoleLabel = '',
  onRemoveOwnReaction,
  className = '',
  headerLimit = 5,
}: ReactionUserListProps) {
  const clipBaseId = useId().replace(/:/g, '')
  const headerItems = reactions.slice(0, headerLimit)
  const hasMoreHeader = reactions.length > headerLimit
  const canRemoveOwn =
    Boolean(onRemoveOwnReaction) &&
    currentUserName.trim().length > 0 &&
    currentUserRoleLabel.trim().length > 0

  return (
    <div className={['reaction-user-list', className].filter(Boolean).join(' ')}>
      <div className="reaction-user-list__header" role="group" aria-label="이모지별 반응 수">
        {headerItems.map((reaction, i) => {
          const item = getReactionEmojiItemByType(reaction.emojiType)
          if (!item) return null
          const clipId = `${clipBaseId}-header-${i}`
          return (
            <div key={`header-${reaction.emojiType}`} className="reaction-user-list__header-stat">
              <span className="reaction-user-list__header-emoji" aria-hidden>
                {item.renderIcon(clipId)}
              </span>
              <span className="reaction-user-list__header-count">{reaction.count}</span>
            </div>
          )
        })}
        {hasMoreHeader ? (
          <span className="reaction-user-list__header-ellipsis" aria-hidden>
            ...
          </span>
        ) : null}
      </div>

      <div className="reaction-user-list__body">
        {users.map((row, index) => {
          const item = getReactionEmojiItemByType(row.emojiType)
          if (!item) return null
          const clipId = `${clipBaseId}-row-${index}`
          const isOwnRow =
            canRemoveOwn &&
            isCurrentUserRow(row, currentUserName, currentUserRoleLabel)

          return (
            <div key={row.id} className="reaction-user-list__row">
              <ProfileAvatarIcon className="reaction-user-list__avatar" />
              <div className="reaction-user-list__meta">
                <span className="reaction-user-list__name" title={row.authorName}>
                  {truncateDisplayNameForList(row.authorName, 3)}
                </span>
                <span className="reaction-user-list__divider">|</span>
                <span className="reaction-user-list__role">{row.roleLabel}</span>
              </div>
              {isOwnRow ? (
                <button
                  type="button"
                  className="reaction-user-list__emoji-btn"
                  aria-label="내 반응 취소"
                  onClick={() => onRemoveOwnReaction?.(row.id)}
                >
                  <span className="reaction-user-list__emoji" aria-hidden>
                    {item.renderIcon(clipId)}
                  </span>
                </button>
              ) : (
                <span className="reaction-user-list__emoji" aria-hidden>
                  {item.renderIcon(clipId)}
                </span>
              )}
            </div>
          )
        })}
        {users.length === 0 ? (
          <div className="reaction-user-list__empty">아직 반응이 없습니다.</div>
        ) : null}
      </div>
    </div>
  )
}
