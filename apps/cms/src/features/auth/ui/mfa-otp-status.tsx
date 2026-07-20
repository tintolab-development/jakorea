/**
 * MFA OTP 상태 표시 컴포넌트
 */

export function MfaOtpStatus() {
  return (
    <div className="mfa-otp-status">
      <p className="mfa-otp-status__hint">
        앱의 코드는 약 30초마다 바뀝니다. 최신 6자리를 입력해 주세요.
      </p>
    </div>
  )
}
