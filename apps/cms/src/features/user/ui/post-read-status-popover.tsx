/**
 * 게시글 읽음/안읽음 뷰어 팝업 본문
 */

import { useMemo, useState } from 'react'
import type { UUID } from '@/types'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import { getPostReadRows, getReadUnreadCountsForPost } from '@/data/mock'
import { truncateDisplayNameForList } from '@/shared/lib/truncate-display-name'
import './post-read-status-popover.css'

export type PostReadStatusTab = 'read' | 'unread'

export interface PostReadStatusPopoverContentProps {
  postId: UUID
  programId: UUID
  /** 게시글의 schoolId */
  postSchoolId?: UUID
  /** 수강 탭: 학교 상세일 때 전달 — post보다 우선 */
  tabSchoolId?: string | null
}

/** 읽음 탭 — 보더는 CSS에서 활성/비활성·data-active-tab으로만 처리 (헤더 박스 보더 없음) */
function PostReadStatusTab({
  active,
  count,
  onSelect,
}: {
  active: boolean
  count: number
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={[
        'post-read-status-popup__tab',
        'post-read-status-popup__tab--read',
        active ? 'post-read-status-popup__tab--active' : 'post-read-status-popup__tab--inactive',
      ].join(' ')}
      onMouseDown={e => e.preventDefault()}
      onClick={onSelect}
    >
      읽음({count})
    </button>
  )
}

/** 안읽음 탭 */
function PostUnreadStatusTab({
  active,
  count,
  onSelect,
}: {
  active: boolean
  count: number
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={[
        'post-read-status-popup__tab',
        'post-read-status-popup__tab--unread',
        active ? 'post-read-status-popup__tab--active' : 'post-read-status-popup__tab--inactive',
      ].join(' ')}
      onMouseDown={e => e.preventDefault()}
      onClick={onSelect}
    >
      안읽음({count})
    </button>
  )
}

export function PostReadStatusPopoverContent({
  postId,
  programId,
  postSchoolId,
  tabSchoolId,
}: PostReadStatusPopoverContentProps) {
  const [tab, setTab] = useState<PostReadStatusTab>('read')

  const schoolScope = tabSchoolId ?? postSchoolId ?? null

  const rows = useMemo(
    () => getPostReadRows(postId, programId, schoolScope),
    [postId, programId, schoolScope]
  )

  const { read: readN, unread: unreadN } = useMemo(
    () => getReadUnreadCountsForPost(postId, programId, schoolScope),
    [postId, programId, schoolScope]
  )

  const readRows = useMemo(() => rows.filter(r => r.hasRead), [rows])
  const unreadRows = useMemo(() => rows.filter(r => !r.hasRead), [rows])

  const list = tab === 'read' ? readRows : unreadRows

  return (
    <div className="post-read-status-popup">
      <div className="post-read-status-popup__frame" data-active-tab={tab}>
        <div className="post-read-status-popup__header">
          <div className="post-read-status-popup__tabs" role="tablist" aria-label="읽음 상태">
            <PostReadStatusTab
              active={tab === 'read'}
              count={readN}
              onSelect={() => setTab('read')}
            />
            <PostUnreadStatusTab
              active={tab === 'unread'}
              count={unreadN}
              onSelect={() => setTab('unread')}
            />
            <div className="post-read-status-popup__tab-row-spacer" aria-hidden />
          </div>
        </div>

        <div className="post-read-status-popup__body-wrap">
          <div className="post-read-status-popup__body">
            {list.length === 0 ? (
              <div className="post-read-status-popup__empty">표시할 인원이 없습니다.</div>
            ) : (
              list.map(row => (
                <div key={row.id} className="post-read-status-popup__row">
                  <ProfileAvatarIcon className="post-read-status-popup__avatar" aria-hidden />
                  <div className="post-read-status-popup__meta">
                    <span
                      className="post-read-status-popup__name"
                      title={row.displayName}
                    >
                      {truncateDisplayNameForList(row.displayName)}
                    </span>
                    <span className="post-read-status-popup__divider">|</span>
                    <span className="post-read-status-popup__role">{row.roleLabel}</span>
                  </div>
                  {tab === 'read' ? (
                    <span className="post-read-status-popup__badge">읽음</span>
                  ) : (
                    <span className="post-read-status-popup__badge post-read-status-popup__badge--muted">
                      안읽음
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
