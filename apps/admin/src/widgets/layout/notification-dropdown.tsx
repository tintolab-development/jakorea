/**
 * 상단 GNB 알림 드롭다운 — CMS notification-dropdown 카테고리·UI 미러
 * 홈페이지 시스템 Inbox는 type=system 으로만 표시한다.
 */

import { useMemo, useState } from 'react'
import { Empty, Spin, Typography } from 'antd'
import { CmsButton } from '@/shared/ui'
import './notification-dropdown.css'

const { Text } = Typography

export type NotificationCategoryKey =
  | 'all'
  | 'matching'
  | 'progress'
  | 'settlement'
  | 'inquiry'
  | 'schedule'
  | 'system'

export type HeaderNotification = {
  id: string
  type: Exclude<NotificationCategoryKey, 'all' | 'inquiry' | 'progress'>
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
  { key: 'progress', label: '프로그램 진행' },
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
        : category === 'inquiry' || category === 'progress'
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
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === category}
            className={`notification-dropdown-tab${
              key === category ? ' notification-dropdown-tab--active' : ''
            }`}
            onClick={event => {
              setCategory(key)
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
      <div className="notification-dropdown-body">
        {status === 'loading' ? (
          <div className="notification-dropdown-empty" role="status" aria-label="로딩 중">
            <Spin />
          </div>
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
          <div className="notification-dropdown-empty">
            {/* CMS EmptyState(notification-dropdown)와 동일 — antd 기본 이미지 · 높이 60 */}
            <Empty
              description="알림이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              styles={{ image: { height: 60 } }}
            />
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
                <div className="notification-dropdown-item-main">
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
                    <NotificationReadBadge read={notification.read} />
                  </div>
                  {notification.programName ? (
                    <Text
                      className="notification-dropdown-item-sub"
                      title={notification.programName}
                    >
                      {notification.programName}
                    </Text>
                  ) : null}
                </div>
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
