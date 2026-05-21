/**
 * 알림 위젯 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 * Row 방식: 상태 태그 | 타이틀 | 타임스탬프
 */

import { Card, Button, Typography, Space, Empty, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { type Notification, type NotificationType } from '../api/notification-service'
import { useNotifications } from '../hooks/use-notifications'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { WIDGET_MORE_ALERT_MESSAGE } from '@/shared/constants/widget-styles'
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
      return '시스템'
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
  const { notifications, loading, unreadCount, markAsRead } = useNotifications()

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
  const hasMoreNotifications =
    notifications.length > displayNotifications.length || notifications.some(n => n.read)

  return (
    <Card
      className="notification-widget"
      loading={loading}
      title={
        <WidgetTitleWithHandle>
          <Space size={4} className="notification-widget__title-inline">
            <span className="widget-card-title">알림 리스트</span>
            {unreadCount > 0 && (
              <Text type="secondary" className="notification-widget__count">
                미확인 {unreadCount}건
              </Text>
            )}
          </Space>
        </WidgetTitleWithHandle>
      }
      extra={
        hasMoreNotifications ? (
          <Button
            type="link"
            size="small"
            onClick={() => window.alert(WIDGET_MORE_ALERT_MESSAGE)}
            className="widget-more-button"
          >
            더보기
          </Button>
        ) : null
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
                    border: 'none' }}
                >
                  {getNotificationTypeLabel(notification.type)}
                </Tag>
                <Text className="notification-item__title">
                  {notification.body || notification.title}
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
  )
}
