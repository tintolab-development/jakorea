import { useMemo, useState } from 'react'
import styles from './notification-dropdown.module.css'

export type HeaderNotification = {
  id: string
  category: string
  message: string
  createdAt: string
  read: boolean
}

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'content', label: '콘텐츠' },
  { key: 'system', label: '시스템' },
] as const

type CategoryKey = (typeof CATEGORIES)[number]['key']

type NotificationDropdownProps = {
  notifications: HeaderNotification[]
  onNotificationClick?: (notification: HeaderNotification) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 상단 GNB 알림 패널 (mock) */
export function NotificationDropdown({
  notifications,
  onNotificationClick,
}: NotificationDropdownProps) {
  const [category, setCategory] = useState<CategoryKey>('all')

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? notifications
        : notifications.filter(n => n.category === category)
    return [...base].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [category, notifications])

  return (
    <div className={styles.notificationDropdownPanel}>
      <div className={styles.notificationDropdownHeader}>
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={[
              styles.notificationDropdownCategoryBtn,
              key === category ? styles.notificationDropdownCategoryBtnActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.notificationDropdownBody}>
        {filtered.length === 0 ? (
          <div className={styles.notificationDropdownEmpty}>알림이 없습니다</div>
        ) : (
          <div className={styles.notificationDropdownList}>
            {filtered.map(item => (
              <div
                key={item.id}
                className={styles.notificationDropdownItem}
                role="button"
                tabIndex={0}
                onClick={() => onNotificationClick?.(item)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onNotificationClick?.(item)
                  }
                }}
              >
                <div className={styles.notificationDropdownItemTitleRow}>
                  <span className={styles.notificationDropdownItemTag}>[{item.category}]</span>
                  <span className={styles.notificationDropdownItemMessage} title={item.message}>
                    {item.message}
                  </span>
                </div>
                <span className={styles.notificationDropdownItemDate}>
                  {formatDate(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
