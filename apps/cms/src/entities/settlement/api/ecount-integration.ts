/**
 * e-count 전자결제 연동 인터페이스
 * V3 Phase 4: e-count 전자결제 연동 준비
 * 
 * TODO: 실제 e-count API 연동 시 구현
 */

import type { Settlement, Instructor } from '@/types/domain'

/**
 * e-count 이체 데이터 포맷
 */
export interface ECountTransferData {
  // 강사 정보
  instructorName: string
  instructorId: string
  residentRegistrationNumber?: string // 주민등록번호 (e-count 필수)
  bankCode: string // 은행 코드
  accountNumber: string // 계좌번호
  accountHolder: string // 예금주명
  
  // 지급 정보
  amount: number // 지급액
  period: string // 기간 (YYYY-MM)
  programTitle: string // 프로그램명
  description?: string // 비고
  
  // 정산 정보
  settlementId: string
  items: Array<{
    type: string
    description: string
    amount: number
  }>
}

/**
 * e-count 이체리스트 생성
 * 여러 정산을 한 번에 이체하기 위한 데이터 포맷
 */
export interface ECountTransferList {
  period: string // 기간 (YYYY-MM)
  totalAmount: number // 총 지급액
  totalCount: number // 총 건수
  transfers: ECountTransferData[]
  generatedAt: string // 생성 일시
}

/**
 * e-count 이체 데이터 변환
 * Settlement → ECountTransferData
 */
export function convertSettlementToECountData(
  settlement: Settlement,
  instructor: Instructor,
  programTitle: string
): ECountTransferData {
  // TODO: 실제 e-count API 스펙에 맞춰 변환 로직 구현
  // 현재는 기본 구조만 정의
  
  return {
    instructorName: instructor.name,
    instructorId: instructor.id,
    residentRegistrationNumber: undefined, // TODO: 강사 정보에서 가져오기
    bankCode: '', // TODO: 계좌번호에서 은행 코드 추출
    accountNumber: instructor.bankAccount || '',
    accountHolder: instructor.name,
    amount: settlement.totalAmount,
    period: settlement.period,
    programTitle,
    description: settlement.notes,
    settlementId: settlement.id,
    items: settlement.items.map(item => ({
      type: item.type,
      description: item.description,
      amount: item.amount,
    })),
  }
}

/**
 * e-count 이체리스트 생성
 */
export function createECountTransferList(
  settlements: Settlement[],
  instructors: Map<string, Instructor>,
  programs: Map<string, { title: string }>
): ECountTransferList {
  const transfers: ECountTransferData[] = []
  let totalAmount = 0

  settlements.forEach(settlement => {
    const instructor = instructors.get(settlement.instructorId)
    const program = programs.get(settlement.programId)
    
    if (instructor && program) {
      const transferData = convertSettlementToECountData(settlement, instructor, program.title)
      transfers.push(transferData)
      totalAmount += settlement.totalAmount
    }
  })

  return {
    period: settlements[0]?.period || '',
    totalAmount,
    totalCount: transfers.length,
    transfers,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * e-count 이체리스트 JSON 생성 (향후 API 전송용)
 */
export function generateECountTransferListJSON(
  transferList: ECountTransferList
): string {
  // TODO: 실제 e-count API 스펙에 맞춰 JSON 포맷 정의
  return JSON.stringify(transferList, null, 2)
}

/**
 * e-count 이체리스트 Excel 생성 (e-count 업로드용)
 */
export async function generateECountTransferListExcel(
  transferList: ECountTransferList
): Promise<void> {
  // TODO: e-count 업로드 포맷에 맞춰 Excel 생성
  // 현재는 기본 구조만 정의
  const { generateTransferList } = await import('@/shared/utils/settlement-document')
  
  const rows = transferList.transfers.map(transfer => ({
    period: transfer.period,
    programTitle: transfer.programTitle,
    instructorName: transfer.instructorName,
    bankAccount: transfer.accountNumber,
    amount: transfer.amount,
  }))
  
  await generateTransferList(rows, { passwordProvided: false })
}
