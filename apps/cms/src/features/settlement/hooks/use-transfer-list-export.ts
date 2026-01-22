/**
 * 이체리스트 다운로드 훅
 */

import { useCallback, useState } from 'react'
import { message } from 'antd'
import { generateTransferList } from '@/shared/utils/settlement-document'

export interface TransferListRow {
  period: string
  programTitle: string
  instructorName: string
  bankAccount: string
  amount: number
}

export function useTransferListExport(rows: TransferListRow[], canExport: boolean) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const openModal = useCallback(() => {
    if (!canExport) {
      message.warning('이체리스트 다운로드는 OWNER 권한에서만 가능합니다')
      return
    }
    if (rows.length === 0) {
      message.info('다운로드할 이체리스트 데이터가 없습니다')
      return
    }
    setIsOpen(true)
  }, [canExport, rows.length])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setPassword('')
  }, [])

  const confirmExport = useCallback(async () => {
    if (!password.trim()) {
      message.warning('암호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      // Phase 0.4.3: 암호 전달 (실제 암호화는 Mock 환경에서 미적용)
      await generateTransferList(rows, { passwordProvided: true, password })
      message.success('이체리스트가 다운로드되었습니다 (Mock: 암호 미적용)')
      closeModal()
    } catch (error) {
      console.error('Failed to export transfer list:', error)
      message.error('이체리스트 다운로드 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [closeModal, password, rows])

  return {
    isOpen,
    password,
    loading,
    openModal,
    closeModal,
    setPassword,
    confirmExport,
  }
}
