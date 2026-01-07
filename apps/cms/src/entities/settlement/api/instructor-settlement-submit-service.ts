/**
 * 강사/봉사자 정산 제출 API (Mock)
 * Phase 6.1.2: 강사/봉사자 정산 제출
 */

import type { UUID } from '@/types'
import type { Settlement, SettlementItem, SettlementStatus, SettlementAttachment } from '@/types/domain'
import { mockSettlements, mockMatchings, mockPrograms } from '@/data/mock'
import dayjs from 'dayjs'

/**
 * 정산 제출 폼 데이터
 */
export interface SettlementSubmitFormData {
  programId: UUID
  matchingId: UUID
  period: string // 월별 또는 프로그램별 (예: "2025-01")
  items: SettlementItem[]
  notes?: string
  attachments?: File[] // 증빙 파일 (Mock에서는 파일 객체만 받고 실제 업로드는 나중에)
}

/**
 * 정산 제출
 */
export async function submitSettlement(
  instructorId: UUID,
  formData: SettlementSubmitFormData
): Promise<Settlement> {
  await new Promise(resolve => setTimeout(resolve, 500))

  // 매칭 확인
  const matching = mockMatchings.find(
    m => m.id === formData.matchingId && m.instructorId === instructorId
  )

  if (!matching) {
    throw new Error('매칭 정보를 찾을 수 없습니다.')
  }

  // 프로그램 확인
  const program = mockPrograms.find(p => p.id === formData.programId)
  if (!program) {
    throw new Error('프로그램 정보를 찾을 수 없습니다.')
  }

  // 총액 계산
  const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0)

  // 첨부 파일 메타데이터 생성 (파일명/크기만 저장)
  const attachments: SettlementAttachment[] | undefined = formData.attachments && formData.attachments.length > 0
    ? formData.attachments.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        fileName: file.name,
        fileSize: file.size,
      }))
    : undefined

  // 새 정산 생성
  const newSettlement: Settlement = {
    id: `settlement-${Date.now()}`,
    programId: formData.programId,
    instructorId,
    matchingId: formData.matchingId,
    period: formData.period,
    items: formData.items,
    totalAmount,
    status: 'pending' as SettlementStatus,
    notes: formData.notes,
    attachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터에 추가
  mockSettlements.push(newSettlement)

  return newSettlement
}

/**
 * 정산 제출 가능한 프로그램/매칭 목록 조회
 * (정산이 아직 제출되지 않은 매칭만 반환)
 */
export async function getAvailableSettlements(
  instructorId: UUID
): Promise<Array<{
  matchingId: UUID
  programId: UUID
  programTitle: string
  period: string
  scheduleCount: number
}>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 본인 매칭 조회
  const myMatchings = mockMatchings.filter(m => m.instructorId === instructorId)

  // 이미 정산이 제출된 매칭 ID 목록
  const submittedMatchingIds = new Set(
    mockSettlements
      .filter(s => s.instructorId === instructorId && s.status !== 'cancelled')
      .map(s => s.matchingId)
  )

  // 정산 제출 가능한 매칭만 필터링
  const availableMatchings = myMatchings.filter(m => !submittedMatchingIds.has(m.id))

  // 프로그램 정보와 함께 반환
  return availableMatchings.map(matching => {
    const program = mockPrograms.find(p => p.id === matching.programId)
    
    // 일정 수 계산 (Mock에서는 간단히 1로 설정, 실제로는 스케줄 데이터에서 계산)
    const scheduleCount = 1

    // 기간 계산 (매칭일 기준으로 월별)
    const matchedDate = typeof matching.matchedAt === 'string' 
      ? dayjs(matching.matchedAt) 
      : dayjs(matching.matchedAt)
    const period = matchedDate.format('YYYY-MM')

    return {
      matchingId: matching.id,
      programId: matching.programId,
      programTitle: program?.title || '알 수 없음',
      period,
      scheduleCount,
    }
  })
}

