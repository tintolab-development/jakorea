/**
 * 상단 GNB 알림 드롭다운 — CMS notification-dropdown UI 미러
 * 탭은 시안 「02. GNB / 06. 알림 리스트」대로 전체·신청·매칭·시스템 3개만 둔다.
 */

import { useMemo, useState } from 'react'
import { Empty, Spin, Typography } from 'antd'
import { CmsButton } from '@/shared/ui'
import './notification-dropdown.css'

const { Text } = Typography

export type NotificationCategoryKey = 'all' | 'matching' | 'system'

export type HeaderNotification = {
  id: string
  type: Exclude<NotificationCategoryKey, 'all'>
  message: string
  createdAt: string
  read: boolean
  /** 알림 본문 (서버 body) */
  body?: string
  link?: string
  /** 안내 팝업 이동 버튼 문구 */
  actionLabel?: string
}

export type NotificationDropdownStatus = 'ready' | 'loading' | 'error' | 'forbidden'

const CATEGORIES: { key: NotificationCategoryKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'matching', label: '신청·매칭' },
  { key: 'system', label: '시스템' },
]

function getCategoryLabel(type: HeaderNotification['type']): string {
  return CATEGORIES.find(c => c.key === type)?.label ?? '알림'
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

/** 알림 한 줄 — CMS notification-dropdown NotificationRow와 같은 마크업 */
function NotificationRow({
  notification,
  onActivate,
}: {
  notification: HeaderNotification
  onActivate: (notification: HeaderNotification) => void
}) {
  const handleItemClick = onActivate
  return (
    <div
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
          <Text className="notification-dropdown-item-message" title={notification.message}>
            {notification.message}
          </Text>
          <NotificationReadBadge read={notification.read} />
        </div>
        {notification.body ? (
          <Text className="notification-dropdown-item-sub" title={notification.body}>
            {notification.body}
          </Text>
        ) : null}
      </div>
      <Text className="notification-dropdown-item-date">
        {formatNotificationDate(notification.createdAt)}
      </Text>
    </div>
  )
}

function byNewest(a: HeaderNotification, b: HeaderNotification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

type NotificationDropdownProps = {
  notifications: HeaderNotification[]
  status?: NotificationDropdownStatus
  onNotificationClick?: (notification: HeaderNotification) => void
  onRetry?: () => void
}

export function NotificationDropdown({
  notifications,
  status = 'ready',
  onNotificationClick,
  onRetry,
}: NotificationDropdownProps) {
  const [category, setCategory] = useState<NotificationCategoryKey>('all')

  const filtered = useMemo(
    () => (category === 'all' ? notifications : notifications.filter(n => n.type === category)),
    [notifications, category],
  )

  // CMS와 같이 안 읽은 알림 → 「읽음」 구역 순, 각 구역은 최신순
  const unreadItems = useMemo(() => filtered.filter(item => !item.read).sort(byNewest), [filtered])
  const readItems = useMemo(() => filtered.filter(item => item.read).sort(byNewest), [filtered])

  // 항목 클릭 → 안내 팝업(시스템 안내 팝업 시안). 화면 이동은 팝업의 이동 버튼에서 한다.
  const handleItemClick = (notification: HeaderNotification) => {
    onNotificationClick?.(notification)
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
          <div className="notification-dropdown-empty">
            시스템 알림은 최고관리자만 확인할 수 있습니다
          </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
