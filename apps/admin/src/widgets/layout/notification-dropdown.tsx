/**
 * 상단 GNB 알림 드롭다운 — CMS notification-dropdown 카테고리·UI 미러
 * 홈페이지 시스템 Inbox는 type=system 으로만 표시한다.
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
  type: Exclude<NotificationCategoryKey, 'all' | 'inquiry'>
  message: string
  createdAt: string
  read: boolean
  programName?: string
  link?: string
}

export type NotificationDropdownStatus = 'ready' | 'loading' | 'error' | 'forbidden'

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
  status?: NotificationDropdownStatus
  onNotificationClick?: (notification: HeaderNotification) => void
  onRetry?: () => void
  onClose?: () => void
}

export function NotificationDropdown({
  notifications,
  status = 'ready',
  onNotificationClick,
  onRetry,
  onClose,
}: NotificationDropdownProps) {
  const [category, setCategory] = useState<NotificationCategoryKey>('all')

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? notifications
        : category === 'inquiry'
          ? []
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
            size="small" className={`notification-dropdown-category-btn ${key === category ? 'notification-dropdown-category-btn--active' : ''}`}
            onClick={() => setCategory(key)} >
            {label}
          </CmsButton>
        ))}
      </div>
      <div className="notification-dropdown-body">
        {status === 'loading' ? (
          <div className="notification-dropdown-empty">알림을 불러오는 중입니다</div>
        ) : status === 'forbidden' ? (
          <div className="notification-dropdown-empty">시스템 알림은 최고관리자만 확인할 수 있습니다</div>
        ) : status === 'error' ? (
          <div className="notification-dropdown-error">
            <div className="notification-dropdown-empty">알림을 불러오지 못했습니다</div>
            {onRetry ? (
              <CmsButton variant="secondary" size="small" type="button" onClick={onRetry}>
                다시 시도
              </CmsButton>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
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
                  <Text className="notification-dropdown-item-sub" title={notification.programName}>
                    {notification.programName}
                  </Text>
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
