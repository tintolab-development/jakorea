import { ClockCircleOutlined } from '@ant-design/icons'

export function VerificationExpiredNotice() {
  return (
    <p className="find-password-verification-expired" role="status">
      <ClockCircleOutlined className="find-password-verification-expired__icon" aria-hidden />
      인증시간이 만료되었어요! 다시 인증해 주세요.
    </p>
  )
}
