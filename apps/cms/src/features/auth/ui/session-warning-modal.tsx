/**
 * 세션 만료 경고 모달
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * 세션 만료 5분 전 경고 및 세션 연장 기능
 */

import { Modal, Typography, Space } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { LoadingButton } from '@/shared/ui'
import { useSessionTimeout } from '../hooks/use-session-timeout'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { Text, Paragraph } = Typography

/**
 * 세션 만료 경고 모달 컴포넌트
 */
export function SessionWarningModal() {
  const { showWarning, countdown, extendSession } = useSessionTimeout()
  const { logout } = useAuthStore()

  if (!showWarning) {
    return null
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  const handleExtend = () => {
    extendSession()
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>세션 만료 경고</span>
        </Space>
      }
      open={showWarning}
      closable={false}
      maskClosable={false}
      footer={[
        <LoadingButton key="extend" type="primary" onClick={handleExtend}>
          세션 연장
        </LoadingButton>,
        <LoadingButton key="logout" onClick={handleLogout}>
          로그아웃
        </LoadingButton>,
      ]}
      centered
    >
      <Paragraph>
        <Text strong>
          {minutes}분 {String(seconds).padStart(2, '0')}초 후 자동으로 로그아웃됩니다.
        </Text>
      </Paragraph>
      <Paragraph type="secondary">
        비활성 상태가 {Math.floor(countdown / 60)}분 이상 지속되어 세션이 만료됩니다.
        <br />
        계속 사용하시려면 '세션 연장' 버튼을 클릭하세요.
      </Paragraph>
    </Modal>
  )
}
