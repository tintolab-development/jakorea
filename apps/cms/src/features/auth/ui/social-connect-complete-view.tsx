import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { CmsButton } from '@/shared/ui'

interface SocialConnectCompleteViewProps {
  maskedEmail: string
  onGoLogin: () => void
  onConnectMore: () => void
}

export function SocialConnectCompleteView({
  maskedEmail,
  onGoLogin,
  onConnectMore,
}: SocialConnectCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <img
          className="register-complete__illustration"
          src={illustCheckUrl}
          alt=""
          aria-hidden="true"
        />
        <h1 className="register-complete__title">소셜 계정이 연결되었습니다.</h1>
        <p className="register-complete__description">
          다음부터 이 계정으로 간편하게 로그인할 수 있습니다.
        </p>

        <div className="register-complete__email-box" aria-label="연결된 계정 이메일">
          {maskedEmail}
        </div>

        <div className="auth-actions register-complete__actions">
          <CmsButton variant="primary" size="h52" onClick={onGoLogin}>
            로그인하기
          </CmsButton>
          {SOCIAL_ACCOUNT_LINK_ENABLED ? (
            <CmsButton variant="default" size="h52" onClick={onConnectMore}>
              다른 소셜 계정도 연결하기
            </CmsButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
