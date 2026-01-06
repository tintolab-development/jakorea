/**
 * 세션 만료 알림 모달
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { Modal, Button, Space } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useNavigate } from 'react-router-dom'

interface SessionExpiryModalProps {
  open: boolean
  onExtend: () => void
  onLogout: () => void
  remainingSeconds?: number
}

export function SessionExpiryModal({
  open,
  onExtend,
  onLogout,
  remainingSeconds,
}: SessionExpiryModalProps) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onLogout()
    navigate('/login')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>세션 만료 경고</span>
        </Space>
      }
      closable={false}
      maskClosable={false}
      footer={
        <Space>
          <Button onClick={handleLogout}>로그아웃</Button>
          <Button type="primary" onClick={onExtend}>
            세션 연장
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <p>세션이 곧 만료됩니다.</p>
        {remainingSeconds !== undefined && remainingSeconds > 0 && (
          <p style={{ color: '#faad14', fontWeight: 500 }}>
            남은 시간: {formatTime(remainingSeconds)}
          </p>
        )}
        <p>계속 사용하시려면 세션을 연장해주세요.</p>
      </div>
    </Modal>
  )
}

