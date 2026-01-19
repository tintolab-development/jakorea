/**
 * 정산 상세 로직 훅
 */

import { useCallback, useMemo } from 'react'
import { message } from 'antd'
import type { Settlement } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { matchingService } from '@/entities/matching/api/matching-service'
import { generatePaymentStatement } from '@/shared/utils/settlement-document'
import { canTransitionSettlementStatus, getPreviousSettlementStatus } from '@/shared/lib/status-transition'

const itemTypeLabels: Record<string, string> = {
  instructor_fee: '강사비',
  transportation: '교통비',
  accommodation: '숙박비',
  other: '기타',
}

interface UseSettlementDetailResult {
  programTitle?: string
  instructorName?: string
  matchingLabel?: string
  canDownload: boolean
  itemColumns: Array<{
    title: string
    dataIndex: string
    key: string
    render?: (value: any) => React.ReactNode
  }>
  changeStatus: (nextStatus: Settlement['status']) => Promise<void>
  rollbackStatus: () => Promise<void>
  downloadPaymentStatement: () => Promise<void>
}

export function useSettlementDetail(
  settlement: Settlement | null,
  onStatusChange: (status: Settlement['status']) => Promise<void>
): UseSettlementDetailResult {
  const program = settlement ? programService.getByIdSync(settlement.programId) : undefined
  const instructor = settlement ? instructorService.getByIdSync(settlement.instructorId) : undefined
  const matching = settlement ? matchingService.getByIdSync(settlement.matchingId) : undefined

  const canDownload = settlement?.status === 'approved' || settlement?.status === 'paid'

  const downloadPaymentStatement = useCallback(async () => {
    if (!settlement || !program || !instructor) {
      message.error('프로그램 또는 강사 정보를 찾을 수 없습니다')
      return
    }

    try {
      await generatePaymentStatement(settlement, instructor, program.title)
      message.success('지급조서가 다운로드되었습니다')
    } catch (error) {
      console.error('Failed to generate payment statement:', error)
      message.error('지급조서 생성 중 오류가 발생했습니다')
    }
  }, [instructor, program, settlement])

  const changeStatus = useCallback(async (nextStatus: Settlement['status']) => {
    if (!settlement || !canTransitionSettlementStatus(settlement.status, nextStatus)) {
      message.warning('현재 상태에서는 해당 단계로 전환할 수 없습니다.')
      return
    }
    await onStatusChange(nextStatus)
  }, [onStatusChange, settlement])

  const rollbackStatus = useCallback(async () => {
    if (!settlement) {
      message.warning('정산 정보가 없습니다.')
      return
    }
    const previous = getPreviousSettlementStatus(settlement.status)
    if (!previous) {
      message.warning('이전 단계로 되돌릴 수 없는 상태입니다.')
      return
    }
    await changeStatus(previous)
  }, [changeStatus, settlement])

  const itemColumns = useMemo(
    () => [
      {
        title: '항목',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => itemTypeLabels[type] || type,
      },
      {
        title: '설명',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '금액',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
      },
    ],
    []
  )

  return {
    programTitle: program?.title,
    instructorName: instructor?.name,
    matchingLabel: matching ? `매칭 #${matching.id.slice(-6)}` : undefined,
    canDownload,
    itemColumns,
    changeStatus,
    rollbackStatus,
    downloadPaymentStatement,
  }
}
