/**
 * 알림 모달 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 */

import { Modal, Typography, Button, Empty, Space, Card } from 'antd'
import {
  BellOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { Notification, NotificationType } from '../api/notification-service'

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

interface NotificationModalProps {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  unreadCount?: number // 위젯에서 계산된 실제 읽지 않은 알림 개수
  onNotificationClick: (notification: Notification) => void
  onConfirm?: (notification: Notification) => void
  onMarkAllAsRead?: () => void
  onRefresh: () => void
}

export function NotificationModal({
  open,
  onClose,
  notifications,
  unreadCount: propUnreadCount,
  onNotificationClick,
  onConfirm,
  onMarkAllAsRead,
  onRefresh,
}: NotificationModalProps) {
  // prop으로 전달된 unreadCount를 우선 사용, 없으면 notifications에서 계산
  const unreadCount =
    propUnreadCount !== undefined ? propUnreadCount : notifications.filter(n => !n.read).length

  // 읽지 않은 알림만 필터링 (위젯과 동일한 로직)
  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <Modal
      title={
        <Space>
          <BellOutlined style={{ color: '#000000', fontSize: 18 }} />
          <Title level={4} style={{ margin: 0, color: '#000000' }}>
            알림
          </Title>
          {unreadCount > 0 && (
            <Text type="secondary" style={{ fontSize: 14 }}>
              ({unreadCount}건)
            </Text>
          )}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        onMarkAllAsRead && (
          <Button key="mark-all" type="link" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
            모두 읽음
          </Button>
        ),
        <Button key="refresh" type="link" onClick={onRefresh}>
          새로고침
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          닫기
        </Button>,
      ].filter(Boolean)}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      {unreadNotifications.length === 0 ? (
        <Empty
          description="알림이 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {unreadNotifications.map(notification => (
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
              onClick={() => onNotificationClick(notification)}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
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
                <div onClick={e => e.stopPropagation()}>
                  {onConfirm && (
                    <Button
                      size="small"
                      onClick={() => onConfirm(notification)}
                      style={{ backgroundColor: '#f5f5f5', borderColor: '#d9d9d9' }}
                    >
                      확인하기
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </Modal>
  )
}
