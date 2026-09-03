import { LoadingButton } from '@/shared/ui'
import { FindEmailSearchIcon } from '@/features/auth/ui/find-email/find-email-search-icon'

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
      <h1 className="password-change-required-complete__title">비밀번호 변경이 완료 되었어요</h1>
      <p className="password-change-required-complete__description">
        이제 JA Korea의 어드민 서비스를 이용할 수 있어요.
        <br />
        변경된 비밀번호로 다시 로그인 해주세요.
      </p>
      <div className="auth-actions password-change-required-complete__actions">
        <LoadingButton type="primary" block className="auth-submit-btn" onClick={onGoLogin}>
          로그인 화면 이동하기
        </LoadingButton>
        <LoadingButton type="default" block className="auth-secondary-btn" onClick={onConnectSocial}>
          소셜계정 연결하기
        </LoadingButton>
      </div>
    </div>
  )
}
