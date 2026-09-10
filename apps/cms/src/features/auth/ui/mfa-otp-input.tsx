/**
 * MFA OTP 입력 컴포넌트
 */

import { Form, Input } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { OTP_POLICY, OTP_LENGTH, clampMfaFailedAttempts } from '@/shared/constants/mfa-policy'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from '@/shared/ui/cms-alert-modal-api'
import './mfa-otp-input.css'

interface MfaOtpInputProps {
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  failedAttempts?: number
  /** 인증 실패 등으로 값이 초기화될 때 증가 — Input.OTP 리마운트 + 첫 칸 포커스 */
  resetToken?: number
}

function focusFirstOtpInput(root: HTMLElement | null): boolean {
  const firstInput = root?.querySelector('input') as HTMLInputElement | null
  if (!firstInput || firstInput.disabled) return false
  firstInput.focus()
  firstInput.select?.()
  return document.activeElement === firstInput
}

function scheduleFocusFirst(root: HTMLElement | null, attempts = 12) {
  let cancelled = false
  const run = (left: number) => {
    if (cancelled || left <= 0) return
    if (focusFirstOtpInput(root)) return
    window.setTimeout(() => run(left - 1), 32)
  }
  const timer = window.setTimeout(() => run(attempts), 0)
  return () => {
    cancelled = true
    window.clearTimeout(timer)
  }
}

export function MfaOtpInput({
  onChange,
  disabled,
  autoFocus = true,
  failedAttempts = 0,
  resetToken = 0,
}: MfaOtpInputProps) {
  const boxesRef = useRef<HTMLDivElement>(null)
  const [otpInstanceKey, setOtpInstanceKey] = useState(0)

  useEffect(() => {
    if (resetToken <= 0) return
    setOtpInstanceKey(token => token + 1)
  }, [resetToken])

  useEffect(() => {
    if (disabled || (!autoFocus && otpInstanceKey === 0)) return
    return scheduleFocusFirst(boxesRef.current)
  }, [autoFocus, disabled, otpInstanceKey])

  // 요청 실패 Alert 닫힌 뒤에도 첫 칸으로 포커스 복구
  useEffect(() => {
    if (disabled) return
    let cancelFocus: (() => void) | undefined
    const onAlertClosed = () => {
      cancelFocus?.()
      cancelFocus = scheduleFocusFirst(boxesRef.current)
    }
    window.addEventListener(CMS_ALERT_MODAL_CLOSED_EVENT, onAlertClosed)
    return () => {
      cancelFocus?.()
      window.removeEventListener(CMS_ALERT_MODAL_CLOSED_EVENT, onAlertClosed)
    }
  }, [disabled, otpInstanceKey])

  return (
    <Form.Item
      name="otpCode"
      rules={[
        { required: true },
        { len: OTP_LENGTH },
        { pattern: /^\d+$/ },
      ]}
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
              <div className="mfa-otp-input__boxes" ref={boxesRef}>
                <Input.OTP
                  key={otpInstanceKey}
                  length={OTP_LENGTH}
                  value={formValue}
                  autoFocus={!disabled && (autoFocus || otpInstanceKey > 0)}
                  onChange={newValue => {
                    setFieldValue('otpCode', newValue)
                    if (onChange) {
                      onChange(newValue)
                    }
                  }}
                  disabled={disabled}
                />
              </div>
              {failedAttempts > 0 && !disabled ? (
                <p className="mfa-otp-input__failure">
                  잘못된 코드를 입력하였습니다. (실패{' '}
                  {clampMfaFailedAttempts(failedAttempts)}회 / 최대{' '}
                  {OTP_POLICY.maxFailedAttempts}회)
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
