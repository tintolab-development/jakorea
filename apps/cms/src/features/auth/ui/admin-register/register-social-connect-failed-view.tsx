import { Button } from 'antd'

import bubbleIconImage from '@/assets/images/logo/bubble.png'

interface RegisterSocialConnectFailedViewProps {
  onRetry: () => void
  onSkipLogin: () => void
}

export function RegisterSocialConnectFailedView({
  onRetry,
  onSkipLogin,
}: RegisterSocialConnectFailedViewProps) {
  return (
    <div className="register-social-connect-failed">
      <img
        src={bubbleIconImage}
        alt=""
        className="register-social-connect-failed__icon"
        width={70}
        height={70}
      />

      <h1 className="register-social-connect-failed__title">소셜 계정을 연결하지 못했어요</h1>

      <p className="register-social-connect-failed__description">잠시후 다시 시도해 주세요.</p>

      <div className="auth-actions register-social-connect-failed__actions">
        <Button type="primary" block className="auth-submit-btn" onClick={onRetry}>
          다시 시도하기
        </Button>
        <Button type="default" block className="auth-secondary-btn" onClick={onSkipLogin}>
          연결하지 않고 로그인하기
        </Button>
      </div>
    </div>
  )
}
