/**
 * 알림 위젯 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 * 가로 전체 너비, 홈 위젯과 디자인 통일, 확인 기능 및 색상 중요도 구분
 */

import { Card, Button, Typography, Space, Empty } from 'antd'
import { BellOutlined, DollarOutlined, FileTextOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from '../api/notification-service'
import { NotificationModal } from './notification-modal'

const { Text, Title } = Typography

const getNotificationIcon = (type: NotificationType): React.ReactNode => {
  switch (type) {
    case 'schedule':
      return <CalendarOutlined style={{ fontSize: 24 }} />
    case 'matching':
      return <CheckCircleOutlined style={{ fontSize: 24 }} />
    case 'settlement':
      return <DollarOutlined style={{ fontSize: 24 }} />
    case 'system':
      return <FileTextOutlined style={{ fontSize: 24 }} />
    default:
      return <BellOutlined style={{ fontSize: 24 }} />
  }
}

const getNotificationBackgroundColor = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return '#e6f7ff' // 파란색 (일정)
    case 'matching':
      return '#f6ffed' // 연두색 (매칭)
    case 'settlement':
      return '#fffbe6' // 노란색 (정산)
    case 'system':
      return '#f0f0f0' // 회색 (시스템)
    default:
      return '#f0f0f0'
  }
}

const getNotificationIconColor = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return '#1890ff' // 파란색
    case 'matching':
      return '#52c41a' // 초록색
    case 'settlement':
      return '#faad14' // 주황색
    case 'system':
      return '#595959' // 회색
    default:
      return '#595959'
  }
}

export function NotificationWidget() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await getNotifications(user.id, user.role)
      setNotifications(data)
    } catch (error) {
      console.error('알림 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
    }
  }, [loadNotifications, user?.id])

  const handleConfirm = async (notification: Notification) => {
    try {
      // 읽음 처리
      if (!notification.read) {
        await markNotificationAsRead(notification.id)
      }
      // 알림 제거
      await deleteNotification(notification.id)
      // 목록에서 제거
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      
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
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const displayNotifications = notifications.filter(n => !n.read).slice(0, 10) // 읽지 않은 알림만 최대 10개 표시

  return (
    <>
      <Card
        style={{ width: '100%' }}
        loading={loading}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <BellOutlined style={{ color: '#000000', fontSize: 18 }} />
              <Title level={5} style={{ margin: 0, color: '#000000' }}>
                알림 리스트
              </Title>
              {unreadCount > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({unreadCount}건)
                </Text>
              )}
            </Space>
            {notifications.length > displayNotifications.length && (
              <Button
                type="link"
                size="small"
                onClick={() => setModalOpen(true)}
              >
                더 보기
              </Button>
            )}
          </div>
        }
      >
        {displayNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Empty
              description="새로운 알림이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {displayNotifications.map((notification) => (
              <Card
                key={notification.id}
                size="small"
                style={{
                  backgroundColor: getNotificationBackgroundColor(notification.type),
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                bodyStyle={{ padding: '16px 20px' }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 16 }}>
                    <div
                      style={{
                        color: getNotificationIconColor(notification.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: 16 }}>
                        {notification.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {notification.message}
                      </Text>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      onClick={() => handleConfirm(notification)}
                      style={{ backgroundColor: '#f5f5f5', borderColor: '#d9d9d9' }}
                    >
                      확인하기
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
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
          if (!user?.id) return
          try {
            await markAllNotificationsAsRead(user.id)
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error)
          }
        }}
        onRefresh={loadNotifications}
      />
    </>
  )
}
