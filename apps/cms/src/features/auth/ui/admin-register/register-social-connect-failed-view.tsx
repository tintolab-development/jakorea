import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { CmsButton } from '@/shared/ui'

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
        src={illustExclamationUrl}
        alt=""
        className="register-social-connect-failed__icon"
        width={84}
        height={84}
        aria-hidden="true"
      />

      <h1 className="register-social-connect-failed__title">소셜 계정을 연결하지 못했습니다.</h1>

      <p className="register-social-connect-failed__description">잠시후 다시 시도해 주세요.</p>

      <div className="auth-actions register-social-connect-failed__actions">
        <CmsButton variant="primary" size="h52" onClick={onRetry}>
          다시 시도하기
        </CmsButton>
        <CmsButton variant="default" size="h52" onClick={onSkipLogin}>
          연결하지 않고 로그인하기
        </CmsButton>
      </div>
    </div>
  )
}
