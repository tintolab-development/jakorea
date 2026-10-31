/**
 * 알림 드롭다운 패널 (스펙: notification-dropdown-spec.md)
 * 최대 406×500, 카테고리 필터 6개(한 줄), 알림 목록
 */

import { Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Notification, NotificationType } from '../api/notification-service'
import type { DateValue } from '@/types'
import { CmsButton, EmptyState } from '@/shared/ui'
import './notification-dropdown.css'

const { Text } = Typography

export type NotificationCategoryKey =
  | 'all'
  | 'matching'
  | 'settlement'
  | 'inquiry'
  | 'schedule'
  | 'system'

const CATEGORIES: { key: NotificationCategoryKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'matching', label: '신청·매칭' },
  { key: 'settlement', label: '정산' },
  { key: 'inquiry', label: '문의' },
  { key: 'schedule', label: '업데이트' },
  { key: 'system', label: '시스템' },
]

const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategoryKey> = {
  schedule: 'schedule',
  matching: 'matching',
  settlement: 'settlement',
  system: 'system',
}

function getCategoryLabel(type: NotificationType): string {
  const key = TYPE_TO_CATEGORY[type]
  return CATEGORIES.find(c => c.key === key)?.label ?? '알림'
}

function formatNotificationDate(createdAt: DateValue): string {
  const d = new Date(createdAt)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function byNewest(a: Notification, b: Notification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number | null
  onNotificationClick: (notification: Notification) => void
  onConfirm?: (notification: Notification) => void
  onClose?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

function NotificationRow({
  notification,
  onActivate,
}: {
  notification: Notification
  onActivate: (notification: Notification) => void
}) {
  return (
    <div
      className={`notification-dropdown-item${
        notification.read ? ' notification-dropdown-item--read' : ''
      }`}
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
      <div className="notification-dropdown-item-title-row">
        <Text className="notification-dropdown-item-tag">[{getCategoryLabel(notification.type)}]</Text>
        <Text
          className="notification-dropdown-item-message"
          title={notification.body || notification.title}
        >
          {notification.body || notification.title}
        </Text>
      </div>
      {notification.programName ? (
        <Text className="notification-dropdown-item-sub">{notification.programName}</Text>
      ) : null}
      <Text className="notification-dropdown-item-date">
        {formatNotificationDate(notification.createdAt)}
      </Text>
    </div>
  )
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onNotificationClick,
  onClose,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: NotificationDropdownProps) {
  const [category, setCategory] = useState<NotificationCategoryKey>('all')
  const bodyRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (category === 'inquiry') return []
    if (category === 'all') return notifications
    return notifications.filter(n => n.type === category)
  }, [notifications, category])

  const unreadItems = useMemo(
    () => filtered.filter(item => !item.read).sort(byNewest),
    [filtered]
  )
  const readItems = useMemo(
    () => filtered.filter(item => item.read).sort(byNewest),
    [filtered]
  )

  useEffect(() => {
    if (!fetchNextPage || !hasNextPage || isFetchingNextPage) return
    if (typeof unreadCount === 'number' && unreadCount > unreadItems.length) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, unreadCount, unreadItems.length])

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

  const handleItemClick = async (notification: Notification) => {
    await onNotificationClick(notification)
    if (notification.link) onClose?.()
  }

  const isEmpty = filtered.length === 0 && !hasNextPage && !isFetchingNextPage
  const unreadLabelCount =
    category === 'all' && typeof unreadCount === 'number' && unreadCount > 0
      ? unreadCount
      : unreadItems.length

  return (
    <div className="notification-dropdown-panel">
      <div className="notification-dropdown-header">
        {CATEGORIES.map(({ key, label }) => (
          <CmsButton
            key={key}
            variant={key === category ? 'primary' : 'default'}
            size="small" className={`notification-dropdown-category-btn ${key === category ? 'notification-dropdown-category-btn--active' : ''}`}
            onClick={() => setCategory(key)} >
            {label}
          </CmsButton>
        ))}
      </div>
      <div ref={bodyRef} className="notification-dropdown-body">
        {isEmpty ? (
          <div className="notification-dropdown-empty">
            <EmptyState description="알림이 없습니다" />
          </div>
        ) : (
          <div className="notification-dropdown-list">
            {unreadItems.length > 0 ||
            (category === 'all' && typeof unreadCount === 'number' && unreadCount > 0) ? (
              <div className="notification-dropdown-section">
                <Text className="notification-dropdown-section-label">
                  미읽음 {unreadLabelCount}건
                </Text>
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
                <Text className="notification-dropdown-section-label">읽음</Text>
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
