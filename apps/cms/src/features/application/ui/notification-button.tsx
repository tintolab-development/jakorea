/**
 * 알림 발송 버튼 컴포넌트
 * Phase 4.2: 알림발송 버튼 → 색깔 변경 (FR-F01)
 * Phase 0.2.3: 문자/이메일/카카오 채널 선택 (FR-C04)
 */

import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { SendOutlined, CheckOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { channelLabels, type NotificationChannel } from '@/entities/application/api/application-notification-service'

interface NotificationButtonProps {
  application: Application
  notificationSent: boolean
  onSend: (channel: NotificationChannel) => Promise<void>
  loading?: boolean
}

export function NotificationButton({
  notificationSent,
  onSend,
  loading = false,
}: NotificationButtonProps) {
  const channels: NotificationChannel[] = ['SMS', 'EMAIL', 'KAKAO']

  const menuItems: MenuProps['items'] = channels.map(ch => ({
    key: ch,
    label: channelLabels[ch],
    disabled: loading,
    onClick: () => onSend(ch),
  }))

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={notificationSent || loading}>
      <Button
        type={notificationSent ? 'default' : 'primary'}
        icon={notificationSent ? <CheckOutlined /> : <SendOutlined />}
        loading={loading}
      >
        {notificationSent ? '발송완료' : '알림발송'}
      </Button>
    </Dropdown>
  )
}
