/**
 * 알림 모달 컴포넌트
 * Phase: 관리자 홈 화면 - 알림 리스트 위젯 형식으로 변경
 */

import { Typography, Space, Card } from 'antd'
import {
  BellOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { CmsButton, LoadingButton, EmptyState, ContentModal } from '@/shared/ui'
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
    <ContentModal
      open={open}
      onCancel={onClose}
      title="알림"
      titlePrefix={<BellOutlined style={{ color: '#000000', fontSize: 18 }} />}
      titleContent={
        <Space>
          <Title level={4} style={{ margin: 0, color: '#000000' }}>
            알림
          </Title>
          {unreadCount > 0 ? (
            <Text type="secondary" style={{ fontSize: 14 }}>
              ({unreadCount}건)
            </Text>
          ) : null}
        </Space>
      }
      width={800}
      modalStyles={{
        body: {
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        },
      }}
      footer={
        <>
          {onMarkAllAsRead ? (
            <LoadingButton type="link" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
              모두 읽음
            </LoadingButton>
          ) : null}
          <LoadingButton type="link" onClick={onRefresh}>
            새로고침
          </LoadingButton>
          <CmsButton variant="primary" onClick={onClose}>
            닫기
          </CmsButton>
        </>
      }
    >
      {unreadNotifications.length === 0 ? (
        <div style={{ padding: '40px 0' }}>
          <EmptyState description="알림이 없습니다" />
        </div>
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
              styles={{ body: { padding: '16px 20px' } }}
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
                      {notification.body}
                    </Text>
                  </div>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  {onConfirm ? (
                    <CmsButton
                      variant="default"
                      size="small"
                      onClick={() => onConfirm(notification)}
                      style={{ backgroundColor: '#f5f5f5', borderColor: '#d9d9d9' }}
                    >
                      확인하기
                    </CmsButton>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </ContentModal>
  )
}
