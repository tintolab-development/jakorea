interface RegisterIdentityModulePlaceholderProps {
  className?: string
}

export function RegisterIdentityModulePlaceholder({
  className,
}: RegisterIdentityModulePlaceholderProps) {
  const rootClass = className
    ? `register-identity-module ${className}`
    : 'register-identity-module'

  return (
    <div className={rootClass} role="region" aria-label="통신사 본인인증 모듈">
      <p className="register-identity-module__title">통신사 본인인증 모듈 영역</p>
      <p className="register-identity-module__meta">
        수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
      </p>
    </div>
  )
}
