/**
 * 알림 위젯 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 * Row 방식: 상태 태그 | 타이틀 | 타임스탬프
 */

import { Card, Button, Typography, Space, Empty, Tag } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { type Notification, type NotificationType } from '../api/notification-service'
import { NotificationModal } from './notification-modal'
import { useNotifications } from '../hooks/use-notifications'
import '@/shared/ui/widget-more-button.css'
import './notification-widget.css'

const { Text } = Typography

const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return '일정'
    case 'matching':
      return '매칭'
    case 'settlement':
      return '정산 요청'
    case 'system':
      return '신규 교사'
    default:
      return '알림'
  }
}

const getNotificationTypeTagColor = (type: NotificationType): { bg: string; text: string } => {
  switch (type) {
    case 'settlement':
      return { bg: '#fff0f6', text: '#c41d7f' } // 분홍
    case 'matching':
    case 'schedule':
      return { bg: '#e6f7ff', text: '#1890ff' } // 파랑
    case 'system':
      return { bg: '#f5f5f5', text: '#595959' } // 회색
    default:
      return { bg: '#f5f5f5', text: '#595959' }
  }
}

const formatTimestamp = (dateValue: string | Date): string => {
  const date = dayjs(dateValue)
  return `${date.format('YY.MM.DD')} | ${date.format('HH:mm')}`
}

export function NotificationWidget() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const {
    notifications,
    loading,
    unreadCount,
    refresh,
    markAsRead,
    removeNotification,
    markAllAsRead,
  } = useNotifications()

  const handleConfirm = async (notification: Notification) => {
    try {
      // 읽음 처리
      if (!notification.read) {
        await markAsRead(notification.id)
      }
      // 알림 제거
      await removeNotification(notification.id)

      // 링크가 있으면 이동
      if (notification.link) {
        navigate(notification.link)
      }
    } catch (error) {
      console.error('알림 확인 처리 실패:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id)
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error)
      }
    }

    if (notification.link) {
      navigate(notification.link)
    }
  }

  const displayNotifications = notifications.filter(n => !n.read).slice(0, 10) // 읽지 않은 알림만 최대 10개 표시

  return (
    <>
      <Card
        className="notification-widget"
        loading={loading}
        title={
          <div className="notification-widget__title">
            <Space>
              <Text strong className="notification-widget__title-text">
                알림 리스트
              </Text>
              {unreadCount > 0 && (
                <Text type="secondary" className="notification-widget__count">
                  미확인 {unreadCount}건
                </Text>
              )}
            </Space>
            {notifications.length > displayNotifications.length && (
              <Button
                type="link"
                size="small"
                onClick={() => setModalOpen(true)}
                className="widget-more-button"
              >
                더보기
              </Button>
            )}
          </div>
        }
      >
        {displayNotifications.length === 0 ? (
          <div className="notification-widget__empty">
            <Empty description="새로운 알림이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className="notification-widget__list">
            {displayNotifications.map(notification => {
              const tagColor = getNotificationTypeTagColor(notification.type)
              return (
                <div
                  key={notification.id}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Tag
                    className="notification-item__tag"
                    style={{
                      backgroundColor: tagColor.bg,
                      color: tagColor.text,
                      border: 'none',
                    }}
                  >
                    {getNotificationTypeLabel(notification.type)}
                  </Tag>
                  <Text className="notification-item__title">
                    {notification.message || notification.title}
                  </Text>
                  <Text type="secondary" className="notification-item__timestamp">
                    {formatTimestamp(notification.createdAt)}
                  </Text>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <NotificationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onConfirm={handleConfirm}
        onMarkAllAsRead={async () => {
          try {
            await markAllAsRead()
          } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error)
          }
        }}
        onRefresh={refresh}
      />
    </>
  )
}
