import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { CmsButton } from '@/shared/ui'

interface FindPasswordCompleteViewProps {
  onGoLogin: () => void
}

export function FindPasswordCompleteView({ onGoLogin }: FindPasswordCompleteViewProps) {
  return (
    <div className="find-password-complete">
      <div className="find-password-complete__body">
        <img
          className="find-password-complete__illustration"
          src={illustCheckUrl}
          alt=""
          aria-hidden="true"
        />

        <h1 className="find-password-complete__title">비밀번호 변경이 완료되었습니다.</h1>
        <p className="find-password-complete__description">
          변경된 비밀번호로 다시 로그인해 주세요.
        </p>

        <div className="auth-actions find-password-complete__actions">
          <CmsButton variant="primary" size="h52" onClick={onGoLogin}>
            로그인하기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
