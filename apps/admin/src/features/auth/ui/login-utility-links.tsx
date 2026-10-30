import { getCmsAuthUrl, shouldExposeCmsAuthLinks } from '@/features/auth/lib/cms-auth-url'

/** CMS 로그인과 동일 카피 — 실제 화면은 CMS 경로로 이동 */
export function LoginUtilityLinks() {
  if (!shouldExposeCmsAuthLinks()) return null

  return (
    <nav className="login-utility-links" aria-label="계정 관련 링크">
      <a href={getCmsAuthUrl('/find-email')} className="login-utility-link">
        이메일 찾기
      </a>
      <span className="login-utility-divider" aria-hidden="true" />
      <a href={getCmsAuthUrl('/find-password')} className="login-utility-link">
        비밀번호 찾기
      </a>
      <span className="login-utility-divider" aria-hidden="true" />
      <a href={getCmsAuthUrl('/register')} className="login-utility-link">
        회원가입 하기
      </a>
    </nav>
  )
}
