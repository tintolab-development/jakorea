import { Button } from 'antd'

import { FindEmailSearchIcon } from './find-email-search-icon'

interface FindEmailResultViewProps {
  maskedEmail: string
  onGoLogin: () => void
  onResetPassword: () => void
}

export function FindEmailResultView({
  maskedEmail,
  onGoLogin,
  onResetPassword,
}: FindEmailResultViewProps) {
  return (
    <div className="find-email-result">
      <div className="find-email-result__body">
        <FindEmailSearchIcon />

        <h1 className="find-email-result__title">가입한 이메일을 찾았어요</h1>
        <p className="find-email-result__description">아래 이메일로 로그인할 수 있어요.</p>

        <div className="find-email-result__email-box" aria-label="찾은 이메일">
          {maskedEmail}
        </div>

        <div className="auth-actions find-email-result__actions">
          <Button type="primary" block className="auth-submit-btn" onClick={onGoLogin}>
            로그인하기
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onResetPassword}>
            비밀번호 재설정하기
          </Button>
        </div>
      </div>
    </div>
  )
}
