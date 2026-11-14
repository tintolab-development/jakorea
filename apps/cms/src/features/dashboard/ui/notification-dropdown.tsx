/**
 * 알림 드롭다운 패널 (스펙: notification-dropdown-spec.md)
 * 최대 420×500, 카테고리 필터 6개(한 줄), 알림 목록
 */

import { Typography } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import type { Notification, NotificationType } from '../api/notification-service'
import { useDragScroll } from '../hooks/use-drag-scroll'
import { formatNotificationDate } from '../lib/notification-inbox-display'
import {
  resolveNotificationServerCategory,
  type NotificationTabKey,
} from '../lib/notification-tab-category'
import { EmptyState } from '@/shared/ui'
import './notification-dropdown.css'

const { Text } = Typography

export type NotificationCategoryKey = NotificationTabKey

const CATEGORIES: { key: NotificationCategoryKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'matching', label: '신청·매칭' },
  { key: 'progress', label: '프로그램 진행' },
  { key: 'settlement', label: '정산' },
  { key: 'inquiry', label: '문의' },
  { key: 'schedule', label: '업데이트' },
  { key: 'system', label: '시스템' },
]

const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategoryKey> = {
  matching: 'matching',
  progress: 'progress',
  settlement: 'settlement',
  inquiry: 'inquiry',
  schedule: 'schedule',
  system: 'system',
}

function getCategoryLabel(type: NotificationType): string {
  const key = TYPE_TO_CATEGORY[type]
  return CATEGORIES.find(c => c.key === key)?.label ?? '알림'
}

function byNewest(a: Notification, b: Notification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number | null
  /** 선택 탭 — 탭별 서버 조회(`?category=`)를 위해 호출부(헤더)가 가진다 */
  category: NotificationCategoryKey
  onCategoryChange: (category: NotificationCategoryKey) => void
  /** 선택 탭 첫 조회 중 — 빈 목록 안내를 미룬다 */
  loading?: boolean
  /** 항목 클릭 — 읽음 처리·안내 팝업은 호출부(헤더)가 담당. 드롭다운은 닫지 않는다 */
  onNotificationClick: (notification: Notification) => void | Promise<void>
  onConfirm?: (notification: Notification) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

function NotificationReadBadge({ read }: { read: boolean }) {
  return (
    <span
      className={`notification-dropdown-item-badge${
        read ? ' notification-dropdown-item-badge--read' : ''
      }`}
    >
      {read ? '읽음' : '읽지 않음'}
    </span>
  )
}

function NotificationRow({
  notification,
  onActivate,
}: {
  notification: Notification
  onActivate: (notification: Notification) => void
}) {
  const read = notification.read
  const message = notification.body || notification.title
  return (
    <div
      className={`notification-dropdown-item${read ? ' notification-dropdown-item--read' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onActivate(notification)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate(notification)
        }
      }}
    >
      <div className="notification-dropdown-item-main">
        <div className="notification-dropdown-item-title-row">
          <Text className="notification-dropdown-item-tag">
            [{getCategoryLabel(notification.type)}]
          </Text>
          <Text className="notification-dropdown-item-message" title={message}>
            {message}
          </Text>
          <NotificationReadBadge read={read} />
        </div>
        {notification.programName ? (
          <Text className="notification-dropdown-item-sub">{notification.programName}</Text>
        ) : null}
      </div>
      <Text className="notification-dropdown-item-date">
        {formatNotificationDate(notification.createdAt)}
      </Text>
    </div>
  )
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  category,
  onCategoryChange,
  loading = false,
  onNotificationClick,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: NotificationDropdownProps) {
  // 서버가 category로 걸러 준 탭은 전체 미읽음 수와 비교하지 않는다(끝 페이지까지 불러오게 됨)
  const serverFiltered = resolveNotificationServerCategory(category) != null
  const bodyRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // 카테고리 탭 — 마우스로 누른 채 끌어 가로 스크롤(끈 경우 탭 선택 안 함)
  const { containerRef: tabsRef, dragScrollHandlers: tabsDragScrollHandlers } =
    useDragScroll<HTMLDivElement>()

  const filtered = useMemo(() => {
    if (category === 'all') return notifications
    return notifications.filter(n => n.type === category)
  }, [notifications, category])

  const unreadItems = useMemo(() => filtered.filter(item => !item.read).sort(byNewest), [filtered])
  const readItems = useMemo(() => filtered.filter(item => item.read).sort(byNewest), [filtered])

  useEffect(() => {
    if (serverFiltered || !fetchNextPage || !hasNextPage || isFetchingNextPage) return
    if (typeof unreadCount === 'number' && unreadCount > unreadItems.length) fetchNextPage()
  }, [
    serverFiltered,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    unreadCount,
    unreadItems.length,
  ])

  useEffect(() => {
    const root = bodyRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !fetchNextPage) return
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        if (!hasNextPage || isFetchingNextPage) return
        fetchNextPage()
      },
      { root, rootMargin: '80px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filtered.length])

  const handleItemClick = (notification: Notification) => {
    void onNotificationClick(notification)
  }

  const isEmpty = filtered.length === 0 && !loading && !hasNextPage && !isFetchingNextPage

  return (
    <div className="notification-dropdown-panel">
      <div ref={tabsRef} className="notification-dropdown-header" {...tabsDragScrollHandlers}>
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === category}
            className={`notification-dropdown-tab${
              key === category ? ' notification-dropdown-tab--active' : ''
            }`}
            onClick={event => {
              onCategoryChange(key)
              // 가로 스크롤 탭 — 선택한 탭이 잘리지 않도록 보이는 영역으로 이동
              event.currentTarget.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth',
              })
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={bodyRef} className="notification-dropdown-body">
        {isEmpty ? (
          <div className="notification-dropdown-empty">
            <EmptyState description="알림이 없습니다" />
          </div>
        ) : (
          <div className="notification-dropdown-list">
            {unreadItems.length > 0 ? (
              <div className="notification-dropdown-section">
                {unreadItems.map(notification => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onActivate={handleItemClick}
                  />
                ))}
              </div>
            ) : null}
            {readItems.length > 0 ? (
              <div className="notification-dropdown-section">
                {readItems.map(notification => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onActivate={handleItemClick}
                  />
                ))}
              </div>
            ) : null}
            <div ref={sentinelRef} className="notification-dropdown-sentinel" aria-hidden />
            {isFetchingNextPage ? (
              <Text className="notification-dropdown-loading">알림을 더 불러오는 중</Text>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
