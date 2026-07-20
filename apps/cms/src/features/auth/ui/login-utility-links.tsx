import { Link } from 'react-router-dom'

interface LoginUtilityLinksProps {
  registerPath: string
}

export function LoginUtilityLinks({ registerPath }: LoginUtilityLinksProps) {
  return (
    <nav className="login-utility-links" aria-label="계정 관련 링크">
      <Link to="/find-email" className="login-utility-link">이메일 찾기</Link>
      <span className="login-utility-divider" aria-hidden="true" />
      <Link to="/find-password" className="login-utility-link">비밀번호 찾기</Link>
      <span className="login-utility-divider" aria-hidden="true" />
      <Link to={registerPath} className="login-utility-link">회원가입 하기</Link>
    </nav>
  )
}
