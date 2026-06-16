/**
 * MFA 모달 헤더 컴포넌트
 */

export function MfaModalHeader() {
  return (
    <header className="mfa-modal-header">
      <h2 className="mfa-modal-header__title">2단계 인증</h2>
      <p className="mfa-modal-header__description">
        Microsoft Authenticator 어플에서 아래 QR을 등록한 뒤,
        <br />
        화면에 표시된 6자리 코드를 입력하세요.
      </p>
    </header>
  )
}
