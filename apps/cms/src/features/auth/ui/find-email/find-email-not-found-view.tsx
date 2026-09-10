import { LoadingButton } from '@/shared/ui'

interface FindEmailNotFoundViewProps {
  onGoRegister: () => void
  onGoLogin: () => void
}

export function FindEmailNotFoundView({ onGoRegister, onGoLogin }: FindEmailNotFoundViewProps) {
  return (
    <div className="find-email-result find-email-not-found">
      <div className="find-email-result__body">
        <h1 className="find-email-result__title">가입된 이메일 정보가 없어요</h1>
        <p className="find-email-result__description">JA Korea 계정을 찾을 수 없어요.</p>

        <div className="auth-actions find-email-result__actions">
          <LoadingButton type="primary" block className="auth-submit-btn" onClick={onGoRegister}>
            회원가입 하기
          </LoadingButton>
          <LoadingButton type="default" block className="auth-secondary-btn" onClick={onGoLogin}>
            로그인 화면 돌아가기
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
