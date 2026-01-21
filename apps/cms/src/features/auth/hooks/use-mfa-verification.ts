/**
 * MFA 인증 모달 로직 Hook
 * Phase 0.5.1: MFA/OTP UX
 * 시니어 개발자 관점: 비즈니스 로직과 UI 분리
 */

import { useState, useEffect, useCallback } from 'react'
import { Form, message } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfa } from '@/features/auth/hooks/use-mfa'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { useOtpCountdown } from '@/features/auth/hooks/use-otp-countdown'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'

interface UseMfaVerificationOptions {
  open: boolean
  messageApi?: ReturnType<typeof import('antd').App.useApp>['message']
}

interface UseMfaVerificationResult {
  // 상태
  form: ReturnType<typeof Form.useForm>[0]
  otpCode: string
  setOtpCode: (value: string) => void
  mfaState: ReturnType<typeof useMfa>['mfaState']
  remainingSeconds: number
  isExpired: boolean
  canResend: boolean
  resendCooldownSeconds: number
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
  sending: boolean
  verifying: boolean
  
  // 액션
  handleSendOtp: () => Promise<void>
  handleVerify: () => Promise<void>
  handleResend: () => Promise<void>
  lockMessage: string | null
}

/**
 * MFA 인증 모달의 비즈니스 로직을 담당하는 Hook
 */
export function useMfaVerification({ open, messageApi }: UseMfaVerificationOptions): UseMfaVerificationResult {
  const { user, setMfaVerified } = useAuthStore()
  const { mfaState, initializeMfa, completeMfa } = useMfa()
  const { sending, verifying, failedAttempts, isLocked, lockUntil, sendOtpCode, verifyOtpCode, reset: resetVerification } = useOtpVerification()
  const { remainingSeconds, isExpired, canResend, resendCooldownSeconds, start: startCountdown } = useOtpCountdown()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  
  // messageApi가 제공되지 않으면 정적 message 사용 (하위 호환성)
  const msg = messageApi || message

  const handleSendOtp = useCallback(async () => {
    if (!user) return

    try {
      await sendOtpCode({
        userId: user.id,
        phoneNumber: user.phone || '010-1234-5678',
      })
      msg.success('인증번호가 발송되었습니다.')
      startCountdown()
      resetVerification()
      form.setFieldsValue({ otpCode: '' })
      setOtpCode('')
    } catch (error: any) {
      msg.error(error.message || '인증번호 발송에 실패했습니다.')
    }
  }, [user, sendOtpCode, startCountdown, resetVerification, form, msg])

  // 모달이 열릴 때 MFA 상태 초기화
  useEffect(() => {
    if (open && user && user.role === 'ADMIN' && !mfaState) {
      const phoneNumber = user.phone || '010-1234-5678'
      initializeMfa(user.id, phoneNumber)
    }
  }, [open, user, mfaState, initializeMfa])

  // MFA 초기화 후 OTP 발송 (한 번만 실행)
  const [otpSent, setOtpSent] = useState(false)
  useEffect(() => {
    if (open && user && user.role === 'ADMIN' && mfaState && !mfaState.isVerified && !otpSent) {
      handleSendOtp()
      setOtpSent(true)
    }
    if (!open) {
      setOtpSent(false)
    }
  }, [open, user, mfaState, handleSendOtp, otpSent])

  // 카운트다운 시작
  useEffect(() => {
    if (open && mfaState && !mfaState.isVerified) {
      startCountdown()
    }
  }, [open, mfaState, startCountdown])

  // 만료 시 알림
  useEffect(() => {
    if (open && isExpired && mfaState && !mfaState.isVerified) {
      msg.warning('인증번호가 만료되었습니다. 다시 발송해주세요.')
    }
  }, [open, isExpired, mfaState])

  // 모달이 닫힐 때 상태 리셋
  useEffect(() => {
    if (!open) {
      // form이 연결되어 있을 때만 resetFields 호출
      // requestAnimationFrame을 사용하여 다음 렌더링 사이클에서 실행
      // 이렇게 하면 form이 완전히 언마운트된 후에는 실행되지 않음
      const frameId = requestAnimationFrame(() => {
        // 한 번 더 확인하여 모달이 여전히 닫혀있는지 확인
        if (!open) {
          try {
            // form 인스턴스가 유효하고 연결되어 있는지 확인
            // form.getFieldsValue()를 호출하여 form이 연결되어 있는지 확인
            if (form && typeof form.resetFields === 'function') {
              try {
                form.getFieldsValue() // form이 연결되어 있으면 에러 없이 실행됨
                form.resetFields()
              } catch {
                // form이 연결되지 않은 경우 무시
                console.debug('Form not connected, skipping resetFields')
              }
            }
          } catch {
            // form이 연결되지 않은 경우 무시 (런타임 경고 방지)
            console.debug('Form not connected, skipping resetFields')
          }
        }
      })
      
      setOtpCode('')
      resetVerification()
      
      return () => cancelAnimationFrame(frameId)
    }
  }, [open, form, resetVerification])


  // OTP 검증 및 완료 로직을 별도 함수로 분리
  const verifyAndComplete = useCallback(async (codeToVerify: string) => {
    if (!user) {
      console.error('[MFA Debug] No user in verifyAndComplete')
      return
    }

    // 추가 검증: 길이 및 숫자 형식
    if (codeToVerify.length !== OTP_LENGTH) {
      console.error('[MFA Debug] OTP length mismatch', { length: codeToVerify.length, expected: OTP_LENGTH })
      try {
        form.setFields([
          {
            name: 'otpCode',
            errors: [`인증번호는 ${OTP_LENGTH}자리입니다.`],
          },
        ])
      } catch {
        msg.error(`인증번호는 ${OTP_LENGTH}자리입니다.`)
      }
      return
    }

    if (!/^\d+$/.test(codeToVerify)) {
      console.error('[MFA Debug] OTP format invalid', { codeToVerify })
      try {
        form.setFields([
          {
            name: 'otpCode',
            errors: ['인증번호는 숫자만 입력 가능합니다.'],
          },
        ])
      } catch {
        msg.error('인증번호는 숫자만 입력 가능합니다.')
      }
      return
    }

    console.log('[MFA Debug] Starting OTP verification', { userId: user.id, otpCode: codeToVerify })

    try {
      const verified = await verifyOtpCode({
        userId: user.id,
        otpCode: codeToVerify,
      })

      console.log('[MFA Debug] OTP verification result', { verified })

      if (verified) {
        console.log('[MFA Debug] OTP verified, completing MFA')
        
        // MFA 완료 처리: 먼저 useMfa의 상태 업데이트
        completeMfa()
        console.log('[MFA Debug] completeMfa called')
        
        // auth-store의 상태 업데이트 (토큰 생성 및 인증 완료)
        setMfaVerified()
        console.log('[MFA Debug] setMfaVerified called')
        
        // 상태 업데이트 확인
        const authState = useAuthStore.getState()
        console.log('[MFA Debug] Auth state after setMfaVerified', {
          isAuthenticated: authState.isAuthenticated,
          requiresMfa: authState.requiresMfa,
          hasToken: !!authState.token,
          user: authState.user?.id,
        })
        
        // 상태 업데이트가 완료될 때까지 약간의 지연
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // 다시 한 번 상태 확인
        const authStateAfterDelay = useAuthStore.getState()
        console.log('[MFA Debug] Auth state after delay', {
          isAuthenticated: authStateAfterDelay.isAuthenticated,
          requiresMfa: authStateAfterDelay.requiresMfa,
          hasToken: !!authStateAfterDelay.token,
        })
        
        message.success('인증이 완료되었습니다.')
        
        // form이 연결되어 있을 때만 resetFields 호출
        try {
          form.resetFields()
        } catch {
          // form이 연결되지 않은 경우 무시
          console.debug('Form not connected, skipping resetFields')
        }
        setOtpCode('')
      } else {
        // 검증 실패 시 Form에 에러 설정
        console.error('[MFA Debug] OTP verification failed')
        try {
          form.setFields([
            {
              name: 'otpCode',
              errors: ['인증번호가 올바르지 않습니다.'],
            },
          ])
          form.setFieldsValue({ otpCode: '' })
        } catch {
          // form이 연결되지 않은 경우 무시
          console.debug('Form not connected, skipping setFieldsValue')
          msg.error('인증번호가 올바르지 않습니다.')
        }
        setOtpCode('')
      }
    } catch (error: any) {
      // 에러 메시지를 Form에 설정하여 중앙 정렬된 에러 메시지 표시
      console.error('[MFA Debug] OTP verification error', error)
      try {
        form.setFields([
          {
            name: 'otpCode',
            errors: [error.message || '인증에 실패했습니다.'],
          },
        ])
        form.setFieldsValue({ otpCode: '' })
      } catch {
        // form이 연결되지 않은 경우 message로만 표시
        message.error(error.message || '인증에 실패했습니다.')
      }
      setOtpCode('')
    }
  }, [user, verifyOtpCode, completeMfa, setMfaVerified, form, msg])

  // handleVerify를 verifyAndComplete를 사용하도록 수정
  const handleVerifyRefactored = useCallback(async (values?: { otpCode?: string }) => {
    console.log('[MFA Debug] handleVerify called', { 
      values,
      otpCode,
      formValues: form.getFieldsValue(),
    })

    if (!user) {
      console.error('[MFA Debug] No user found')
      msg.error('사용자 정보를 찾을 수 없습니다.')
      return
    }

    // Form 검증 먼저 수행
    try {
      await form.validateFields(['otpCode'])
      // 검증 성공 시 form에서 최신 값 가져오기
      const formValues = form.getFieldsValue()
      const finalCode = formValues.otpCode || values?.otpCode || otpCode
      
      console.log('[MFA Debug] Form validation passed', { finalCode, formValues })
      
      if (!finalCode) {
        console.error('[MFA Debug] No OTP code after validation')
        return
      }
      
      // 최신 코드로 업데이트
      setOtpCode(finalCode)
      
      // 검증 로직 계속 진행
      await verifyAndComplete(finalCode)
    } catch (error) {
      // Form 검증 실패 시 에러 메시지는 Form.Item에서 표시됨
      console.error('[MFA Debug] Form validation failed', error)
      return
    }
  }, [user, otpCode, form, verifyAndComplete, setOtpCode, msg])

  const handleResend = useCallback(async () => {
    if (!canResend) {
      msg.warning(`재전송은 ${Math.ceil(resendCooldownSeconds / 60)}분 후에 가능합니다.`)
      return
    }
    await handleSendOtp()
  }, [canResend, resendCooldownSeconds, handleSendOtp])

  // 잠금 상태 메시지 (lockUntil 기반)
  const lockMessage = isLocked && lockUntil
    ? `인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.`
    : null

  return {
    form,
    otpCode,
    setOtpCode,
    mfaState,
    remainingSeconds,
    isExpired,
    canResend,
    resendCooldownSeconds,
    failedAttempts,
    isLocked,
    lockUntil,
    sending,
    verifying,
    handleSendOtp,
    handleVerify: handleVerifyRefactored,
    handleResend,
    lockMessage,
  }
}
