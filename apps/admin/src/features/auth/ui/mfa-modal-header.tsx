interface MfaModalHeaderProps {
  isLocalTest?: boolean
}

export function MfaModalHeader({ isLocalTest = false }: MfaModalHeaderProps) {
  return (
    <header className="mfa-modal-header">
      <h2 className="mfa-modal-header__title">2단계 인증</h2>
      <p className="mfa-modal-header__description">
        {isLocalTest ? (
          <>
            개발/테스트 환경입니다.
            <br />
            아래 입력란에 안내된 6자리 테스트 코드를 입력하세요.
          </>
        ) : (
          <>
            Microsoft Authenticator 어플에서 아래 QR을 등록한 뒤,
            <br />
            화면에 표시된 6자리 코드를 입력하세요.
          </>
        )}
      </p>
    </header>
  )
}
