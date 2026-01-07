/**
 * 알림 리스트 컴포넌트
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import { Badge, Popover, List, Typography, Button, Empty, Tag } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from '../api/notification-service'

const { Text } = Typography

const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return '일정'
    case 'matching':
      return '매칭'
    case 'settlement':
      return '정산'
    case 'system':
      return '시스템'
    default:
      return '알림'
  }
}

const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return 'blue'
    case 'matching':
      return 'green'
    case 'settlement':
      return 'orange'
    case 'system':
      return 'default'
    default:
      return 'default'
  }
}

export function NotificationList() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
    }
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await getNotifications(user.id)
      setNotifications(data)
    } catch (error) {
      console.error('알림 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        )
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error)
      }
    }

    if (notification.link) {
      navigate(notification.link)
      setOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return

    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const content = (
    <div style={{ width: 360, maxHeight: 480, overflowY: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong>알림</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            모두 읽음
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty
          description="알림이 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <List
          dataSource={notifications}
          loading={loading}
          renderItem={notification => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: notification.read ? 'transparent' : '#f0f7ff',
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={getNotificationTypeColor(notification.type)}>
                      {getNotificationTypeLabel(notification.type)}
                    </Tag>
                    <Text strong={!notification.read}>{notification.title}</Text>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {notification.message}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(notification.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          size="large"
          icon={<BellOutlined style={{ fontSize: 25 }} />}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        />
      </Badge>
    </Popover>
  )
}
