/**
 * 지급조서 목록 훅
 */

import { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import type { PaymentStatement } from '@/types/domain'
import { paymentStatementService } from '@/entities/settlement/api/payment-statement-service'
import { settlementService } from '@/entities/settlement/api/settlement-service'
import { useInstructorService } from '@/features/instructor/hooks/use-instructor-service'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { generatePaymentStatement } from '@/shared/utils/settlement-document'
import { canDownloadPaymentStatement } from '@/shared/utils/download-permission'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { MESSAGES } from '@/shared/constants'
import type { TransferListRow } from './use-transfer-list-export'

export type PaymentStatementFilter = {
  period?: string
  status?: PaymentStatement['status']
  programId?: string
  keyword?: string
}

export function usePaymentStatements() {
  const { user } = useAuthStore()
  const { getNameById: getInstructorNameById } = useInstructorService()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const [statements, setStatements] = useState<PaymentStatement[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<PaymentStatementFilter>({})

  const fetchStatements = useCallback(async () => {
    setLoading(true)
    try {
      const data = await paymentStatementService.getAll()
      setStatements(data)
    } catch (error) {
      console.error('Failed to fetch payment statements:', error)
      message.error(MESSAGES.error.paymentStatementListLoadFailed)
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredStatements = useMemo(() => {
    return statements.filter(statement => {
      if (filters.period && statement.period !== filters.period) {
        return false
      }
      if (filters.status && statement.status !== filters.status) {
        return false
      }
      if (filters.programId && statement.programId !== filters.programId) {
        return false
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const instructorName = getInstructorNameById(statement.instructorId).toLowerCase()
        const programTitle = getProgramByIdSync(statement.programId)?.title.toLowerCase() || ''
        if (!instructorName.includes(keyword) && !programTitle.includes(keyword)) {
          return false
        }
      }
      return true
    })
  }, [
    filters.keyword,
    filters.period,
    filters.programId,
    filters.status,
    statements,
    getInstructorNameById,
    getProgramByIdSync,
  ])

  const availablePeriods = useMemo(() => {
    return Array.from(new Set(statements.map(statement => statement.period)))
      .sort()
      .reverse()
  }, [statements])

  const statusOptions: Array<{ label: string; value: PaymentStatement['status'] }> = [
    { label: '준비됨', value: 'ready' },
    { label: '다운로드 완료', value: 'downloaded' },
    { label: '취소', value: 'cancelled' },
  ]

  const transferRows: TransferListRow[] = useMemo(() => {
    return statements
      .filter(statement => statement.status !== 'cancelled')
      .map(statement => {
        const program = programService.getByIdSync(statement.programId)
        const instructor = instructorService.getByIdSync(statement.instructorId)

        return {
          period: statement.period,
          programTitle: program?.title || '프로그램 정보 없음',
          instructorName: instructor?.name || '강사 정보 없음',
          bankAccount: instructor?.bankAccount || '-',
          amount: statement.totalAmount,
        }
      })
  }, [statements])

  const downloadStatement = useCallback(
    async (statement: PaymentStatement) => {
      // Phase 0.4.3: 권한 체크 (OWNER만 다운로드 가능)
      if (!canDownloadPaymentStatement(user, statement.programId)) {
        message.warning(MESSAGES.warning.paymentStatementDownloadOwnerOnly)
        return
      }

      try {
        const settlement = await settlementService.getById(statement.settlementId)
        const program = programService.getByIdSync(statement.programId)
        const instructor = instructorService.getByIdSync(statement.instructorId)

        if (!settlement || !program || !instructor) {
          message.error('지급조서 정보를 찾을 수 없습니다')
          return
        }

        await generatePaymentStatement(settlement, instructor, program.title)

        const updated = await paymentStatementService.update(statement.id, {
          status: 'downloaded',
          lastDownloadedAt: new Date().toISOString(),
        })

        setStatements(prev => prev.map(item => (item.id === updated.id ? updated : item)))
        message.success('지급조서가 다운로드되었습니다')
      } catch (error) {
        console.error('Failed to download payment statement:', error)
        message.error('지급조서 다운로드 중 오류가 발생했습니다')
      }
    },
    [user]
  )

  const resetFilters = () => setFilters({})

  return {
    statements,
    filteredStatements,
    loading,
    filters,
    availablePeriods,
    statusOptions,
    transferRows,
    fetchStatements,
    setFilters,
    resetFilters,
    downloadStatement,
  }
}
