/**
 * MFA OTP 입력 컴포넌트
 */

import { Form, Input } from 'antd'
import { useEffect, useRef } from 'react'
import { OTP_POLICY, OTP_LENGTH } from '@/shared/constants/mfa-policy'
import './mfa-otp-input.css'

interface MfaOtpInputProps {
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  failedAttempts?: number
}

export function MfaOtpInput({
  onChange,
  disabled,
  autoFocus = true,
  failedAttempts = 0,
}: MfaOtpInputProps) {
  const inputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      const timer = setTimeout(() => {
        const firstInput = inputRef.current?.querySelector('input') as HTMLInputElement | null
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, disabled])

  return (
    <Form.Item
      name="otpCode"
      rules={[{ required: true }, { len: OTP_LENGTH }, { pattern: /^\d+$/ }]}
      validateStatus=""
      help=""
      className="mfa-otp-input-field"
    >
      <Form.Item shouldUpdate noStyle>
        {({ getFieldValue, setFieldValue, getFieldError }) => {
          const formValue = getFieldValue('otpCode') || ''
          const errors = getFieldError('otpCode')

          return (
            <div className="mfa-otp-input">
              <div className="mfa-otp-input__boxes" ref={inputRef}>
                <Input.OTP
                  length={OTP_LENGTH}
                  value={formValue}
                  onChange={newValue => {
                    setFieldValue('otpCode', newValue)
                    if (onChange) {
                      onChange(newValue)
                    }
                  }}
                  disabled={disabled}
                />
              </div>
              {failedAttempts > 0 ? (
                <p className="mfa-otp-input__failure">
                  잘못된 코드를 입력하였습니다. (실패 횟수: {failedAttempts} /{' '}
                  {OTP_POLICY.maxFailedAttempts})
                </p>
              ) : null}
              {errors && errors.length > 0 && failedAttempts === 0 ? (
                <p className="mfa-otp-input__failure">{errors[0]}</p>
              ) : null}
            </div>
          )
        }}
      </Form.Item>
    </Form.Item>
  )
}
