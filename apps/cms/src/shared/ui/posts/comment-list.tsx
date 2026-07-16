/**
 * 댓글 목록 — 아바타·작성자·날짜·본문
 */

import type { ReactNode } from 'react'
import { ProfileAvatarIcon } from '@/shared/ui/icons/ProfileAvatarIcon'
import './comment-list.css'

export type CommentListItem = {
  id: string
  authorName: string
  createdAtLabel: string
  content: string
}

export interface CommentListProps {
  items: CommentListItem[]
  className?: string
  /** 아바타 슬롯 — 미전달 시 ProfileAvatarIcon */
  renderAvatar?: (item: CommentListItem) => ReactNode
}

export function CommentList({ items, className = '', renderAvatar }: CommentListProps) {
  if (items.length === 0) return null

  return (
    <div className={['comment-list', className].filter(Boolean).join(' ')}>
      {items.map(item => (
        <div key={item.id} className="comment-list__item">
          {renderAvatar ? (
            renderAvatar(item)
          ) : (
            <ProfileAvatarIcon className="comment-list__avatar" />
          )}
          <div className="comment-list__body">
            <div className="comment-list__header">
              <span className="comment-list__author">{item.authorName}</span>
              <span className="comment-list__date">{item.createdAtLabel}</span>
            </div>
            <p className="comment-list__content">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
