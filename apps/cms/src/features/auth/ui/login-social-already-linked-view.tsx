import { Button } from 'antd'

import bubbleIconImage from '@/assets/images/logo/bubble.png'

interface LoginSocialAlreadyLinkedViewProps {
  onConnectOtherSocial: () => void
  onEmailLogin: () => void
}

export function LoginSocialAlreadyLinkedView({
  onConnectOtherSocial,
  onEmailLogin,
}: LoginSocialAlreadyLinkedViewProps) {
  return (
    <div className="login-social-already-linked">
      <img
        src={bubbleIconImage}
        alt=""
        className="login-social-already-linked__icon"
        width={70}
        height={70}
      />

      <h2 className="login-social-already-linked__title">
        이 소셜 계정은 이미 다른
        <br />
        JA Korea 계정에 연결되어 있어요
      </h2>

      <p className="login-social-already-linked__description">
        다른 소셜 계정을 사용하거나 기존 계정으로 로그인해 주세요.
      </p>

      <div className="login-social-already-linked__actions">
        <Button
          type="primary"
          block
          className="login-submit-btn"
          onClick={onConnectOtherSocial}
        >
          다른 소셜계정 연결하기
        </Button>
        <Button block className="login-secondary-btn" onClick={onEmailLogin}>
          이메일로 로그인
        </Button>
      </div>
    </div>
  )
}
