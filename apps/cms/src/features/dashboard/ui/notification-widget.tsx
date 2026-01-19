/**
 * 알림 위젯 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 * 가로 전체 너비, 홈 위젯과 디자인 통일, 확인 기능 및 색상 중요도 구분
 */

import { Card, Button, Typography, Space, Empty } from 'antd'
import { BellOutlined, DollarOutlined, FileTextOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type Notification,
  type NotificationType,
} from '../api/notification-service'
import { NotificationModal } from './notification-modal'
import { useNotifications } from '../hooks/use-notifications'
import './notification-widget.css'

const { Text, Title } = Typography

const getNotificationIcon = (type: NotificationType): React.ReactNode => {
  switch (type) {
    case 'schedule':
      return <CalendarOutlined className="notification-item__icon-svg" />
    case 'matching':
      return <CheckCircleOutlined className="notification-item__icon-svg" />
    case 'settlement':
      return <DollarOutlined className="notification-item__icon-svg" />
    case 'system':
      return <FileTextOutlined className="notification-item__icon-svg" />
    default:
      return <BellOutlined className="notification-item__icon-svg" />
  }
}

const getNotificationTypeClass = (type: NotificationType): string => {
  switch (type) {
    case 'schedule':
      return 'notification-item--schedule'
    case 'matching':
      return 'notification-item--matching'
    case 'settlement':
      return 'notification-item--settlement'
    case 'system':
      return 'notification-item--system'
    default:
      return 'notification-item--system'
  }
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
              <BellOutlined className="notification-widget__bell" />
              <Title level={5} className="notification-widget__title-text">
                알림 리스트
              </Title>
              {unreadCount > 0 && (
                <Text type="secondary" className="notification-widget__count">
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
          <div className="notification-widget__empty">
            <Empty
              description="새로운 알림이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Space direction="vertical" size="middle" className="notification-widget__list">
            {displayNotifications.map((notification) => (
              <Card
                key={notification.id}
                size="small"
                className={`notification-item ${getNotificationTypeClass(notification.type)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-item__row">
                  <div className="notification-item__content">
                    <div className="notification-item__icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-item__text">
                      <Title level={5} className="notification-item__title">
                        {notification.title}
                      </Title>
                      <Text type="secondary" className="notification-item__message">
                        {notification.message}
                      </Text>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="notification-item__actions">
                    <Button
                      size="small"
                      onClick={() => handleConfirm(notification)}
                      className="notification-item__confirm"
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
