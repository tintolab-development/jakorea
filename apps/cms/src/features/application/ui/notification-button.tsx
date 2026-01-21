/**
 * 알림 발송 버튼 컴포넌트
 * Phase 4.2: 알림발송 버튼 → 색깔 변경 (FR-F01)
 */

import { Button } from 'antd'
import { SendOutlined, CheckOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'

interface NotificationButtonProps {
  application: Application
  notificationSent: boolean
  onSend: () => Promise<void>
  loading?: boolean
}

export function NotificationButton({
  notificationSent,
  onSend,
  loading = false,
}: NotificationButtonProps) {
  return (
    <Button
      type={notificationSent ? 'default' : 'primary'}
      icon={notificationSent ? <CheckOutlined /> : <SendOutlined />}
      disabled={notificationSent || loading}
      onClick={onSend}
      loading={loading}
    >
      {notificationSent ? '발송완료' : '알림발송'}
    </Button>
  )
}
