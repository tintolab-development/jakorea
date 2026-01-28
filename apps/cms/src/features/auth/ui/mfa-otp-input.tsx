/**
 * MFA OTP 입력 컴포넌트
 * Phase 0.5.1: MFA/OTP UX
 * 시니어 개발자 관점: UI 컴포넌트 분리
 * UX/UI 디자이너 관점: 중앙 정렬 및 일관된 UI
 */

import { Form, Input } from 'antd'
import { useEffect, useRef } from 'react'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'

interface MfaOtpInputProps {
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function MfaOtpInput({ onChange, disabled, autoFocus = true }: MfaOtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // 자동 포커스 설정
  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      // 약간의 지연을 두어 모달이 완전히 렌더링된 후 포커스 설정
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
      rules={[
        { required: true, message: '인증번호를 입력해주세요.' },
        {
          len: OTP_LENGTH,
          message: `인증번호는 ${OTP_LENGTH}자리입니다.`,
        },
        {
          pattern: /^\d+$/,
          message: '인증번호는 숫자만 입력 가능합니다.',
        },
      ]}
      validateStatus=""
      help=""
      style={{ marginBottom: 0 }}
    >
      <Form.Item shouldUpdate noStyle>
        {({ getFieldValue, setFieldValue, getFieldError }) => {
          const formValue = getFieldValue('otpCode') || ''
          const errors = getFieldError('otpCode')

          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }} ref={inputRef}>
                <Input.OTP
                  length={OTP_LENGTH}
                  value={formValue}
                  onChange={newValue => {
                    // Form에 값 설정
                    setFieldValue('otpCode', newValue)
                    // 외부 onChange도 호출 (있는 경우)
                    if (onChange) {
                      onChange(newValue)
                    }
                  }}
                  disabled={disabled}
                  size="large"
                />
              </div>
              {/* 에러 메시지 중앙 정렬 */}
              {errors && errors.length > 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#ff4d4f',
                    fontSize: '14px',
                    marginTop: '8px',
                    width: '100%',
                  }}
                >
                  {errors[0]}
                </div>
              )}
            </div>
          )
        }}
      </Form.Item>
    </Form.Item>
  )
}
