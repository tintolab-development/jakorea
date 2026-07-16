/**
 * 알림 드롭다운 패널 (스펙: notification-dropdown-spec.md)
 * 최대 406×500, 카테고리 필터 6개(한 줄), 알림 목록
 */

import { Typography } from 'antd'
import { useState, useMemo } from 'react'
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
  system: 'system' }

function getCategoryLabel(type: NotificationType): string {
  const key = TYPE_TO_CATEGORY[type]
  return CATEGORIES.find(c => c.key === key)?.label ?? '알림'
}

function formatNotificationDate(createdAt: DateValue): string {
  const d = new Date(createdAt)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  onNotificationClick: (notification: Notification) => void
  onConfirm?: (notification: Notification) => void
  onClose?: () => void
}

export function NotificationDropdown({
  notifications,
  unreadCount: _unreadCount,
  onNotificationClick,
  onClose }: NotificationDropdownProps) {
  const [category, setCategory] = useState<NotificationCategoryKey>('all')

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? notifications
        : category === 'inquiry'
          ? [] // 추후 API 확장
          : notifications.filter(n => n.type === category)

    return [...base].sort((a, b) => {
      // 1) 미읽음 우선
      if (a.read !== b.read) return a.read ? 1 : -1
      // 2) 같은 상태 내에서는 최신순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notifications, category])

  const handleItemClick = async (notification: Notification) => {
    await onNotificationClick(notification)
    if (notification.link) onClose?.()
  }

  return (
    <div className="notification-dropdown-panel">
      <div className="notification-dropdown-header">
        {CATEGORIES.map(({ key, label }) => (
          <CmsButton
            key={key}
            variant={key === category ? 'primary' : 'default'}
            size="small"
            className={`notification-dropdown-category-btn ${key === category ? 'notification-dropdown-category-btn--active' : ''}`}
            onClick={() => setCategory(key)}
          >
            {label}
          </CmsButton>
        ))}
      </div>
      <div className="notification-dropdown-body">
        {filtered.length === 0 ? (
          <div className="notification-dropdown-empty">
            <EmptyState description="알림이 없습니다" />
          </div>
        ) : (
          <div className="notification-dropdown-list">
            {filtered.map(notification => (
              <div
                key={notification.id}
                className={`notification-dropdown-item ${notification.read ? 'notification-dropdown-item--read' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(notification)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleItemClick(notification)
                  }
                }}
              >
                <div className="notification-dropdown-item-title-row">
                  <Text className="notification-dropdown-item-tag">
                    [{getCategoryLabel(notification.type)}]
                  </Text>
                  <Text
                    className="notification-dropdown-item-message"
                    title={notification.body || notification.title}
                  >
                    {notification.body || notification.title}
                  </Text>
                </div>
                {notification.programName && (
                  <Text className="notification-dropdown-item-sub">{notification.programName}</Text>
                )}
                <Text className="notification-dropdown-item-date">
                  {formatNotificationDate(notification.createdAt)}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
