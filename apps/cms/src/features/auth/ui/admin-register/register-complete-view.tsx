import { LoadingButton } from '@/shared/ui'
import { JaKoreaLogo } from '@/shared/ui/icons/JaKoreaLogo'

interface RegisterCompleteViewProps {
  onGoLogin: () => void
}

export function RegisterCompleteView({ onGoLogin }: RegisterCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <JaKoreaLogo className="register-complete__logo" />
        <h1 className="register-complete__title">가입이 완료되었어요!</h1>
        <p className="register-complete__description">
          관리자 승인 후에 로그인 및 이용이 가능합니다.
        </p>

        <div className="auth-actions register-complete__actions">
          <LoadingButton type="primary" block className="auth-submit-btn" onClick={onGoLogin}>
            로그인하러 가기
          </LoadingButton>
        </div>
      </div>
      <div className="register-complete__trailing" aria-hidden />
    </div>
  )
}
