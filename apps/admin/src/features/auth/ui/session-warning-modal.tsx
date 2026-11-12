import { Typography } from 'antd'
import { SESSION_POLICY_DISPLAY } from '@jakorea/domain/session'
import { CmsButton, ContentModal } from '@/shared/ui'
import { useSessionTimeout } from '../hooks/use-session-timeout'
import { LOGIN_PATH } from '@/shared/lib/login-redirect'
import './session-warning-modal.css'

const { Paragraph } = Typography

const SESSION_WARNING_Z_INDEX = 4000
/** CMS Figma 16011:86297 / 16011:86520 popup 폭 */
const SESSION_WARNING_WIDTH = 600

export function SessionWarningModal() {
  const {
    showWarning,
    warningKind,
    extendError,
    extending,
    dismissWarning,
    extendIdleSession,
    logout,
  } = useSessionTimeout()

  // 사용자가 직접 로그아웃 — 로그인 후 원래 화면으로 복귀하지 않도록 redirect 없이 이동
  // (이 모달은 RouterProvider 밖에 있어 navigate 대신 location을 쓴다)
  const handleLogout = () => {
    logout()
    window.location.assign(LOGIN_PATH)
  }

  if (!showWarning || warningKind == null) return null

  const isIdle = warningKind === 'idle'

  return (
    <ContentModal
      open
      onCancel={dismissWarning}
      zIndex={SESSION_WARNING_Z_INDEX}
      wrapClassName="session-warning-modal-wrap"
      rootClassName="session-warning-modal-root"
      width={SESSION_WARNING_WIDTH}
      title={isIdle ? SESSION_POLICY_DISPLAY.idleTitle : SESSION_POLICY_DISPLAY.absoluteTitle}
      footer={
        isIdle ? (
          <>
            <CmsButton variant="secondary" size="medium" type="button" onClick={handleLogout}>
              {SESSION_POLICY_DISPLAY.idleLogoutLabel}
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              loading={extending}
              onClick={() => void extendIdleSession()}
            >
              {SESSION_POLICY_DISPLAY.idleExtendLabel}
            </CmsButton>
          </>
        ) : (
          <CmsButton variant="secondary" size="medium" type="button" onClick={dismissWarning}>
            {SESSION_POLICY_DISPLAY.absoluteConfirmLabel}
          </CmsButton>
        )
      }
    >
      <div data-session-warning-root="true">
        <Paragraph className="session-warning-modal__body">
          {isIdle ? SESSION_POLICY_DISPLAY.idleBody : SESSION_POLICY_DISPLAY.absoluteBody}
        </Paragraph>
        {extendError ? (
          <Paragraph type="danger" style={{ marginBottom: 0 }}>
            {extendError}
          </Paragraph>
        ) : null}
      </div>
    </ContentModal>
  )
}
