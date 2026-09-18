/**
 * 게시글 읽음/안읽음 뷰어 팝업 본문
 */

import { useMemo, useState } from 'react'
import type { UUID } from '@/types'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import { getPostReadRows, getReadUnreadCountsForPost } from '@/data/mock'
import { truncateDisplayNameForList } from '@/shared/lib/truncate-display-name'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useGeneralProgramPostReads } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
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

export function PostReadStatusPopoverContent({
  postId,
  programId,
  postSchoolId,
  tabSchoolId,
}: PostReadStatusPopoverContentProps) {
  const [tab, setTab] = useState<PostReadStatusTab>('read')
  const [selectedUnreadIds, setSelectedUnreadIds] = useState<string[]>([])
  const [sendingReminder, setSendingReminder] = useState(false)

  const schoolScope = tabSchoolId ?? postSchoolId ?? null
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const remoteReads = useGeneralProgramPostReads(programId, postId, remoteEnabled)

  const rows = useMemo(() => {
    if (remoteEnabled) return remoteReads.rows
    return getPostReadRows(postId, programId, schoolScope)
  }, [postId, programId, remoteEnabled, remoteReads.rows, schoolScope])

  const { read: readN, unread: unreadN } = useMemo(() => {
    if (remoteEnabled) {
      return { read: remoteReads.readCount, unread: remoteReads.unreadCount }
    }
    return getReadUnreadCountsForPost(postId, programId, schoolScope)
  }, [
    postId,
    programId,
    remoteEnabled,
    remoteReads.readCount,
    remoteReads.unreadCount,
    schoolScope,
  ])

  const readRows = useMemo(() => rows.filter(r => r.hasRead), [rows])
  const unreadRows = useMemo(() => rows.filter(r => !r.hasRead), [rows])

  const list = tab === 'read' ? readRows : unreadRows

  const toggleUnreadChecked = (id: string, checked: boolean) => {
    setSelectedUnreadIds(prev => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter(x => x !== id)
    })
  }

  const handleSendReminder = async () => {
    if (selectedUnreadIds.length === 0 || sendingReminder) return
    if (!remoteEnabled) {
      window.alert('준비 중입니다.')
      return
    }
    setSendingReminder(true)
    try {
      await remoteReads.sendUnreadReminder(selectedUnreadIds)
      setSelectedUnreadIds([])
      cmsAlertModal.show({
        title: '알림 발송',
        content: '미읽음 대상에게 알림을 발송했습니다.',
      })
    } catch (error) {
      cmsAlertModal.show({
        title: '알림 발송 실패',
        content: getGeneralProgramApiErrorMessage(error, '미읽음 알림을 발송하지 못했습니다.'),
      })
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <div className={`post-read-status-popup post-read-status-popup--${tab}`}>
      <div className="post-read-status-popup__frame" data-active-tab={tab}>
        <div className="post-read-status-popup__header">
          <div className="post-read-status-popup__tabs">
            <button
              type="button"
              className={[
                'post-read-status-popup__tab',
                'post-read-status-popup__tab--read',
                tab === 'read'
                  ? 'post-read-status-popup__tab--active'
                  : 'post-read-status-popup__tab--inactive',
              ].join(' ')}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setTab('read')}
            >
              읽음({readN})
            </button>
            <button
              type="button"
              className={[
                'post-read-status-popup__tab',
                'post-read-status-popup__tab--unread',
                tab === 'unread'
                  ? 'post-read-status-popup__tab--active'
                  : 'post-read-status-popup__tab--inactive',
              ].join(' ')}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setTab('unread')}
            >
              안읽음({unreadN})
            </button>
            <div className="post-read-status-popup__tab-row-spacer" aria-hidden />
          </div>
        </div>

        <div className="post-read-status-popup__body-wrap">
          <div className="post-read-status-popup__body">
            {tab === 'unread' ? (
              <div className="post-read-status-popup__unread-actions">
                <span className="post-read-status-popup__notify-title-text">알림 발송</span>
                <button
                  type="button"
                  className="post-read-status-popup__action-btn"
                  disabled={unreadRows.length === 0}
                  onClick={() => {
                    if (selectedUnreadIds.length === unreadRows.length) {
                      setSelectedUnreadIds([])
                      return
                    }
                    setSelectedUnreadIds(unreadRows.map(row => row.id))
                  }}
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  className="post-read-status-popup__action-btn post-read-status-popup__action-btn--primary"
                  disabled={selectedUnreadIds.length === 0 || sendingReminder}
                  onClick={() => {
                    void handleSendReminder()
                  }}
                >
                  알림 발송
                </button>
              </div>
            ) : null}
            {remoteEnabled && remoteReads.loading ? (
              <div className="post-read-status-popup__empty">불러오는 중…</div>
            ) : list.length === 0 ? (
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
                    <span className="post-read-status-popup__name-role-divider" aria-hidden>
                      |
                    </span>
                    <span className="post-read-status-popup__role">{row.roleLabel}</span>
                  </div>
                  {tab === 'read' ? (
                    <span className="post-read-status-popup__badge">읽음</span>
                  ) : (
                    <label className="post-read-status-popup__checkbox-wrap" aria-label="안읽음 선택">
                      <input
                        type="checkbox"
                        className="post-read-status-popup__checkbox"
                        checked={selectedUnreadIds.includes(row.id)}
                        onChange={e => toggleUnreadChecked(row.id, e.target.checked)}
                      />
                    </label>
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
