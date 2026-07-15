import { LoadingButton } from '@/shared/ui'

import { FindEmailSearchIcon } from '@/features/auth/ui/find-email/find-email-search-icon'

interface FindPasswordCompleteViewProps {
  onGoLogin: () => void
}

export function FindPasswordCompleteView({ onGoLogin }: FindPasswordCompleteViewProps) {
  return (
    <div className="find-password-complete">
      <div className="find-password-complete__body">
        <FindEmailSearchIcon />

        <h1 className="find-password-complete__title">비밀번호 변경이 완료 되었어요</h1>
        <p className="find-password-complete__description">
          변경된 비밀번호로 다시 로그인 해주세요.
        </p>

        <div className="auth-actions find-password-complete__actions">
          <LoadingButton type="primary" block className="auth-submit-btn" onClick={onGoLogin}>
            로그인하기
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
