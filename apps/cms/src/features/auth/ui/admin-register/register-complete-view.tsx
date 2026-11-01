import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { CmsButton } from '@/shared/ui'

interface RegisterCompleteViewProps {
  onGoLogin: () => void
}

export function RegisterCompleteView({ onGoLogin }: RegisterCompleteViewProps) {
  return (
    <div className="register-complete">
      <div className="register-complete__body">
        <img
          className="register-complete__illustration"
          src={illustCheckUrl}
          alt=""
          aria-hidden="true"
        />
        <h1 className="register-complete__title">가입이 완료되었습니다.</h1>
        <p className="register-complete__description">
          관리자 승인 후에 로그인 및 이용이 가능합니다.
        </p>

        <div className="auth-actions register-complete__actions">
          <CmsButton variant="primary" size="h52" onClick={onGoLogin}>
            로그인 화면 돌아가기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
