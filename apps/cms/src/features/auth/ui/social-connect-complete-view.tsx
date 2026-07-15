import { LoadingButton } from '@/shared/ui'
import { JaKoreaLogo } from '@/shared/ui/icons/JaKoreaLogo'

interface SocialConnectCompleteViewProps {
  onGoHome: () => void
  onConnectMore: () => void
}

export function SocialConnectCompleteView({
  onGoHome,
  onConnectMore,
}: SocialConnectCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <JaKoreaLogo className="register-complete__logo" />
        <h1 className="register-complete__title">소셜 계정이 연결되었어요!</h1>
        <p className="register-complete__description">
          다음부터 이 계정으로 간편하게 로그인할 수 있어요.
        </p>

        <div className="auth-actions register-complete__actions">
          <LoadingButton type="primary" block className="auth-submit-btn" onClick={onGoHome}>
            홈으로 이동하기
          </LoadingButton>
          <LoadingButton type="default" block className="auth-secondary-btn" onClick={onConnectMore}>
            다른 소셜계정도 연결하기
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
