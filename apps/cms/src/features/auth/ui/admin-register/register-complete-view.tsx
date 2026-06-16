import { Button } from 'antd'

interface RegisterCompleteViewProps {
  onGoLogin: () => void
  onGoMypage: () => void
  onConnectSocial: () => void
}

export function RegisterCompleteView({
  onGoLogin,
  onGoMypage,
  onConnectSocial,
}: RegisterCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <h1 className="register-complete__title">가입이 완료되었어요!</h1>
        <p className="register-complete__description">
          이제 JA Korea의 다양한 프로그램과 소식을 확인할 수 있어요.
        </p>

        <div className="auth-actions register-complete__actions">
          <Button type="primary" block className="auth-submit-btn" onClick={onGoLogin}>
            로그인하러 가기
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onGoMypage}>
            마이페이지로 이동하기
          </Button>
        </div>
      </div>

      <div className="register-complete__social-link-wrap">
        <button type="button" className="register-complete__social-link" onClick={onConnectSocial}>
          소셜계정 연결하기
        </button>
      </div>
    </div>
  )
}
