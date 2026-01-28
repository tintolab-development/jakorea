/**
 * 이체리스트 다운로드 훅
 * Phase 0.4.3: Excel 암호화 기능 검증 및 테스트
 */

import { useCallback, useState } from 'react'
import { message } from 'antd'
import { generateTransferList } from '@/shared/utils/settlement-document'
import { MESSAGES } from '@/shared/constants'

export interface TransferListRow {
  period: string
  programTitle: string
  instructorName: string
  bankAccount: string
  bankName?: string
  amount: number
}

/**
 * 비밀번호 강도 계산
 */
function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  score: number
} {
  let score = 0

  // 길이 체크
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // 복잡도 체크
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) return { strength: 'weak', score }
  if (score <= 4) return { strength: 'medium', score }
  return { strength: 'strong', score }
}

export type TransferListFormat = 'standard' | 'bank'

export function useTransferListExport(rows: TransferListRow[], canExport: boolean) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [enableEncryption, setEnableEncryption] = useState(true)
  const [format, setFormat] = useState<TransferListFormat>('bank')
  const [loading, setLoading] = useState(false)

  const passwordStrength = calculatePasswordStrength(password)
  const passwordsMatch = password === passwordConfirm || !passwordConfirm

  const openModal = useCallback(() => {
    if (!canExport) {
      message.warning(MESSAGES.warning.transferListDownloadOwnerOnly)
      return
    }
    if (rows.length === 0) {
      message.info(MESSAGES.info.noTransferListData)
      return
    }
    setIsOpen(true)
  }, [canExport, rows.length])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setPassword('')
    setPasswordConfirm('')
    setEnableEncryption(true)
  }, [])
  const setFormatHandler = useCallback((v: TransferListFormat) => setFormat(v), [])

  const confirmExport = useCallback(async () => {
    // Phase 0.4.3: 암호화 옵션 체크
    if (enableEncryption) {
      if (!password.trim()) {
        message.warning(MESSAGES.warning.enterPassword)
        return
      }

      if (password.length < 8) {
        message.warning(MESSAGES.warning.passwordMinLength)
        return
      }

      if (!passwordsMatch) {
        message.warning(MESSAGES.warning.passwordMismatch)
        return
      }
    }

    setLoading(true)
    try {
      await generateTransferList(rows, {
        passwordProvided: enableEncryption,
        password: enableEncryption ? password : undefined,
        format,
      })
      message.success(
        enableEncryption
          ? '암호화된 이체리스트가 다운로드되었습니다. 파일을 열 때 암호가 필요합니다.'
          : '이체리스트가 다운로드되었습니다'
      )
      closeModal()
    } catch (error: any) {
      console.error('Failed to export transfer list:', error)

      // Phase 0.4.3: 에러 타입별 메시지 처리
      let errorMessage = '이체리스트 다운로드 중 오류가 발생했습니다'

      if (error?.message) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      // 암호 관련 에러인 경우 특별 처리
      if (errorMessage.includes('암호') || errorMessage.includes('password')) {
        message.error(errorMessage)
      } else {
        message.error(`${errorMessage}\n파일 생성에 실패했습니다. 다시 시도해주세요.`)
      }
    } finally {
      setLoading(false)
    }
  }, [closeModal, password, passwordConfirm, passwordsMatch, enableEncryption, format, rows])

  return {
    isOpen,
    password,
    passwordConfirm,
    enableEncryption,
    format,
    setFormat: setFormatHandler,
    passwordStrength,
    passwordsMatch,
    loading,
    openModal,
    closeModal,
    setPassword,
    setPasswordConfirm,
    setEnableEncryption,
    confirmExport,
  }
}
