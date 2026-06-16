import { Button } from 'antd'

import { LoginUtilityLinks } from './login-utility-links'
import { LoginSocialSection } from './login-social-section'

interface LoginSocialNotLinkedViewProps {
  registerPath: string
  onEmailLogin: () => void
}

export function LoginSocialNotLinkedView({
  registerPath,
  onEmailLogin,
}: LoginSocialNotLinkedViewProps) {
  return (
    <div className="login-social-not-linked">
      <div className="login-social-not-linked__heading">
        <h2 className="login-social-not-linked__title">연결된 소셜 계정이 없어요</h2>
        <p className="login-social-not-linked__subtitle">
          이 소셜 계정과 연결된 JA Korea 계정을 찾을 수 없어요.
        </p>
      </div>

      <div className="login-social-not-linked__body">
        <p className="login-social-not-linked__body-text">
          먼저 이메일로 로그인한 뒤, [내 정보 수정]에서 소셜 계정을 연결해 주세요.
        </p>
        <p className="login-social-not-linked__body-text">
          회원가입이 처음이라면 이메일로 가입한 뒤 소셜 계정을 연결할 수 있어요.
        </p>
      </div>

      <Button type="primary" block className="login-submit-btn" onClick={onEmailLogin}>
        이메일로 로그인
      </Button>

      <LoginUtilityLinks registerPath={registerPath} />
      <LoginSocialSection />
    </div>
  )
}
