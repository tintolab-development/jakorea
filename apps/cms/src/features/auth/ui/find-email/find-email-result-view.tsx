import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { CmsButton } from '@/shared/ui'

interface FindEmailResultViewProps {
  /** 본인인증 후 찾은 이메일 전체(정책 CMS-02, 마스킹하지 않음) */
  email: string
  onGoLogin: () => void
  onResetPassword: () => void
}

export function FindEmailResultView({
  email,
  onGoLogin,
  onResetPassword,
}: FindEmailResultViewProps) {
  return (
    <div className="find-email-result">
      <div className="find-email-result__body">
        <img
          className="find-email-result__illustration"
          src={illustCheckUrl}
          alt=""
          aria-hidden="true"
        />

        <h1 className="find-email-result__title">가입한 이메일을 찾았습니다.</h1>
        <p className="find-email-result__description">아래 이메일로 로그인할 수 있습니다.</p>

        <div className="find-email-result__email-box" aria-label="찾은 이메일">
          {email}
        </div>

        <div className="auth-actions find-email-result__actions">
          <CmsButton variant="primary" size="h52" onClick={onGoLogin}>
            로그인하기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onResetPassword}>
            비밀번호 재설정하기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
