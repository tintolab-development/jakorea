import { JaKoreaLogo } from '@/shared/ui/icons/JaKoreaLogo'
import { CmsButton } from '@/shared/ui'

interface RegisterSocialConnectCompleteViewProps {
  onGoLogin: () => void
  onConnectMore: () => void
}

export function RegisterSocialConnectCompleteView({
  onGoLogin,
  onConnectMore,
}: RegisterSocialConnectCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <JaKoreaLogo className="register-complete__logo" />
        <h1 className="register-complete__title">소셜 계정이 연결되었어요!</h1>
        <p className="register-complete__description">
          다음부터 이 계정으로 간편하게 로그인할 수 있어요.
        </p>

        <div className="auth-actions register-complete__actions">
          <CmsButton variant="primary" size="h52" width="100%" onClick={onGoLogin}>
            로그인하러 가기
          </CmsButton>
          <CmsButton variant="default" size="h52" width="100%" onClick={onConnectMore}>
            다른 소셜 계정도 연결하기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
