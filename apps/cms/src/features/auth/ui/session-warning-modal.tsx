/**
 * 세션 만료 경고 모달 — ContentModal 셸
 * X/마스크 클릭 시 세션 연장(안전한 기본 동작). zIndex 4000.
 */

import { Typography } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { CmsButton, ContentModal } from '@/shared/ui'
import { useSessionTimeout } from '../hooks/use-session-timeout'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { Text, Paragraph } = Typography

const SESSION_WARNING_Z_INDEX = 4000

export function SessionWarningModal() {
  const { showWarning, countdown, extendSession } = useSessionTimeout()
  const { logout } = useAuthStore()

  if (!showWarning) {
    return null
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <ContentModal
      open={showWarning}
      onCancel={extendSession}
      zIndex={SESSION_WARNING_Z_INDEX}
      title="세션 만료 경고"
      titlePrefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
      footer={
        <>
          <CmsButton variant="primary" size="medium" type="button" onClick={extendSession}>
            세션 연장
          </CmsButton>
          <CmsButton variant="secondary" size="medium" type="button" onClick={() => logout()}>
            로그아웃
          </CmsButton>
        </>
      }
    >
      <Paragraph>
        <Text strong>
          {minutes}분 {String(seconds).padStart(2, '0')}초 후 자동으로 로그아웃됩니다.
        </Text>
      </Paragraph>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        비활성 상태가 {Math.floor(countdown / 60)}분 이상 지속되어 세션이 만료됩니다.
        <br />
        계속 사용하시려면 &apos;세션 연장&apos; 버튼을 클릭하세요.
      </Paragraph>
    </ContentModal>
  )
}
