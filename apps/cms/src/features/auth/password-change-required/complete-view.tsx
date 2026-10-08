import { FindEmailSearchIcon } from '@/features/auth/ui/find-email/find-email-search-icon'
import { CmsButton } from '@/shared/ui'

interface PasswordChangeRequiredCompleteViewProps {
  onGoLogin: () => void
  onConnectSocial: () => void
}

export function PasswordChangeRequiredCompleteView({
  onGoLogin,
  onConnectSocial,
}: PasswordChangeRequiredCompleteViewProps) {
  return (
    <div className="password-change-required-complete">
      <div className="password-change-required-complete__icon">
        <FindEmailSearchIcon />
      </div>
      <h1 className="password-change-required-complete__title">비밀번호 변경이 완료되었어요</h1>
      <p className="password-change-required-complete__description">
        이제 JA Korea의 어드민 서비스를 이용할 수 있어요.
        <br />
        변경된 비밀번호로 다시 로그인해 주세요.
      </p>
      <div className="auth-actions password-change-required-complete__actions">
        <CmsButton variant="primary" size="h52" width="100%" onClick={onGoLogin}>
          로그인 화면 이동하기
        </CmsButton>
        <CmsButton variant="default" size="h52" width="100%" onClick={onConnectSocial}>
          소셜 계정 연결하기
        </CmsButton>
      </div>
    </div>
  )
}
