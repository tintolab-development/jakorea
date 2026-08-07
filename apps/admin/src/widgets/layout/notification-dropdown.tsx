/**
 * 상단 GNB 알림 드롭다운 — CMS notification-dropdown 카테고리·UI 미러
 * (auth/API 연동 전 mock)
 */

import { useMemo, useState } from 'react'
import { Typography } from 'antd'
import { CmsButton } from '@/shared/ui'
import './notification-dropdown.css'

const { Text } = Typography

export type NotificationCategoryKey =
  | 'all'
  | 'matching'
  | 'settlement'
  | 'inquiry'
  | 'schedule'
  | 'system'

export type HeaderNotification = {
  id: string
  /** CMS NotificationType 과 동일 키 */
  type: Exclude<NotificationCategoryKey, 'all' | 'inquiry'>
  message: string
  createdAt: string
  read: boolean
  programName?: string
  link?: string
}

const CATEGORIES: { key: NotificationCategoryKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'matching', label: '신청·매칭' },
  { key: 'settlement', label: '정산' },
  { key: 'inquiry', label: '문의' },
  { key: 'schedule', label: '업데이트' },
  { key: 'system', label: '시스템' },
]

const TYPE_TO_CATEGORY: Record<HeaderNotification['type'], NotificationCategoryKey> = {
  schedule: 'schedule',
  matching: 'matching',
  settlement: 'settlement',
  system: 'system',
}

function getCategoryLabel(type: HeaderNotification['type']): string {
  const key = TYPE_TO_CATEGORY[type]
  return CATEGORIES.find(c => c.key === key)?.label ?? '알림'
}

function formatNotificationDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

type NotificationDropdownProps = {
  notifications: HeaderNotification[]
  onNotificationClick?: (notification: HeaderNotification) => void
  onClose?: () => void
}

export function NotificationDropdown({
  notifications,
  onNotificationClick,
  onClose,
}: NotificationDropdownProps) {
  const [category, setCategory] = useState<NotificationCategoryKey>('all')

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? notifications
        : category === 'inquiry'
          ? [] // 추후 API 확장 (CMS와 동일)
          : notifications.filter(n => n.type === category)

    return [...base].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notifications, category])

  const handleItemClick = (notification: HeaderNotification) => {
    onNotificationClick?.(notification)
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
          <div className="notification-dropdown-empty">알림이 없습니다</div>
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
                    title={notification.message}
                  >
                    {notification.message}
                  </Text>
                </div>
                {notification.programName ? (
                  <Text className="notification-dropdown-item-sub">{notification.programName}</Text>
                ) : null}
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
