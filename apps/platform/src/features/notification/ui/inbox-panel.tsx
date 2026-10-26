import { useEffect, useRef, useState } from 'react'
import { PFEmptyState, PFLoadingSpinner, PFTabs, PFText } from '@/shared/ui'
import type { MemberNotificationResponse } from '../api/client'
import {
  useMarkMyNotificationClickedMutation,
  useMyNotificationsInfiniteQuery,
} from '../api/hooks'
import { formatNotificationDate } from '../lib/format'
import {
  NOTIFICATION_CATEGORY_ALL,
  NOTIFICATION_CATEGORY_TABS,
  type NotificationCategoryTabKey,
} from '../model/categories'
import styles from './inbox-panel.module.css'

const TAB_ITEMS = NOTIFICATION_CATEGORY_TABS.map(tab => ({ key: tab.key, label: tab.label }))

export type NotificationInboxPanelVariant = 'popover' | 'embedded'

type NotificationInboxPanelProps = {
  /** `popover`: PC 헤더 드롭다운(420×500). `embedded`: 모달 본문을 채운다 */
  variant?: NotificationInboxPanelVariant
  className?: string
}

function NotificationInboxItem({
  item,
  onSelect,
}: {
  item: MemberNotificationResponse
  onSelect: (item: MemberNotificationResponse) => void
}) {
  const isRead = Boolean(item.readAt)
  const categoryLabel = item.notificationCategoryLabel?.trim()

  return (
    <li className={styles.itemRow}>
      <button
        type="button"
        className={[styles.item, isRead ? styles.itemRead : styles.itemUnread].join(' ')}
        onClick={() => onSelect(item)}
      >
        <span className={styles.itemBody}>
          <span className={styles.itemTitle}>
            {categoryLabel ? (
              <PFText as="span" typo="bd-md-sb" color="primary-500" className={styles.category}>
                [{categoryLabel}]
              </PFText>
            ) : null}
            <PFText
              as="span"
              typo="bd-md-sb"
              color="black"
              className={[styles.ellipsis, styles.titleText].join(' ')}
            >
              {item.title?.trim() || '-'}
            </PFText>
          </span>
          <PFText
            as="span"
            typo="bd-sm-md"
            color="neutral-cool-500"
            className={styles.ellipsis}
          >
            {item.message?.trim() || '-'}
          </PFText>
        </span>
        <PFText as="span" typo="label-md" color="neutral-cool-500">
          {formatNotificationDate(item.createdAt)}
        </PFText>
        {isRead ? null : <span className={styles.srOnly}>읽지 않음</span>}
      </button>
    </li>
  )
}

export function NotificationInboxPanel({
  variant = 'popover',
  className,
}: NotificationInboxPanelProps) {
  const [category, setCategory] = useState<NotificationCategoryTabKey>(NOTIFICATION_CATEGORY_ALL)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { items, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMyNotificationsInfiniteQuery(category, true)
  const markClicked = useMarkMyNotificationClickedMutation()

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [category])

  useEffect(() => {
    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !hasNextPage || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting) && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '80px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length])

  const handleSelect = (item: MemberNotificationResponse) => {
    if (item.recipientId == null || markClicked.isPending) return
    markClicked.mutate(item.recipientId)
  }

  let content
  if (isLoading) {
    content = (
      <div className={styles.status}>
        <PFLoadingSpinner label="알림을 불러오는 중" />
      </div>
    )
  } else if (isError && items.length === 0) {
    content = (
      <div className={styles.status}>
        <PFEmptyState variant="inline" title="알림을 불러오지 못했습니다." />
      </div>
    )
  } else if (items.length === 0) {
    content = (
      <div className={styles.status}>
        <PFEmptyState variant="inline" title="알림이 없습니다." />
      </div>
    )
  } else {
    content = (
      <>
        <ul className={styles.items}>
          {items.map(item => (
            <NotificationInboxItem
              key={item.recipientId ?? `${item.eventId}-${item.createdAt}`}
              item={item}
              onSelect={handleSelect}
            />
          ))}
        </ul>
        {hasNextPage ? (
          <div ref={sentinelRef} className={styles.sentinel}>
            {isFetchingNextPage ? <PFLoadingSpinner label="알림을 더 불러오는 중" /> : null}
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div
      className={[
        styles.panel,
        variant === 'popover' ? styles.popover : styles.embedded,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.tabBar}>
        <PFTabs
          items={TAB_ITEMS}
          value={category}
          onChange={key => setCategory(key as NotificationCategoryTabKey)}
          variant="underline"
          underlineStyle="isolated"
          size="small"
          ariaLabel="알림 카테고리"
        />
      </div>
      <div ref={listRef} className={styles.list} role="tabpanel">
        {content}
      </div>
    </div>
  )
}
