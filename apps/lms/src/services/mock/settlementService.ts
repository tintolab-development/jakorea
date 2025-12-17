/**
 * 정산 Mock API Service
 * Phase 4: 정산 CRUD, 정산 산출 로직, Excel 문서 생성
 */

import type { Settlement, SettlementItem, UUID, PaginatedResponse } from '../../types'
import { mockSettlements, mockSettlementsMap, mockSettlementsByProgram, mockSettlementsByInstructor, mockSettlementsByMatching } from '../../data/mock/settlements'
import { mockPrograms } from '../../data/mock/programs'

export interface SettlementListParams {
  page: number
  pageSize: number
  programId?: UUID
  instructorId?: UUID
  matchingId?: UUID
  status?: Settlement['status']
  period?: string
  search?: string
  sortBy?: 'createdAt' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface SettlementFilters {
  programId?: UUID
  instructorId?: UUID
  matchingId?: UUID
  status?: Settlement['status']
  period?: string
  search?: string
}

/**
 * 정산 산출 로직
 * 프로그램별 단가 규칙을 적용하여 정산 항목 계산
 */
export function calculateSettlement(
  programId: UUID,
  _instructorId: UUID,
  _matchingId: UUID,
  baseHours: number = 1
): SettlementItem[] {
  const program = mockPrograms.find(p => p.id === programId)
  if (!program) {
    throw new Error('프로그램을 찾을 수 없습니다')
  }

  const items: SettlementItem[] = []

  // 기본 강사비 계산 (프로그램 형태에 따라 차등)
  let instructorFeeRate = 150000 // 기본 시간당 강사비
  switch (program.format) {
    case 'workshop':
      instructorFeeRate = 200000
      break
    case 'seminar':
      instructorFeeRate = 180000
      break
    case 'course':
      instructorFeeRate = 250000
      break
    case 'lecture':
      instructorFeeRate = 150000
      break
    default:
      instructorFeeRate = 150000
  }

  items.push({
    type: 'instructor_fee',
    description: '강사비',
    amount: instructorFeeRate * baseHours,
  })

  // 오프라인 프로그램인 경우 교통비 추가 (50% 확률, 단거리/장거리 구분)
  if (program.type === 'offline' || program.type === 'hybrid') {
    const hasTransportation = Math.random() > 0.5
    if (hasTransportation) {
      items.push({
        type: 'transportation',
        description: '교통비',
        amount: Math.random() > 0.5 ? 30000 : 60000, // 단거리/장거리
      })
    }
  }

  // 하루 이상 프로그램인 경우 숙박비 추가 (30% 확률)
  if (baseHours >= 8) {
    const hasAccommodation = Math.random() > 0.7
    if (hasAccommodation) {
      items.push({
        type: 'accommodation',
        description: '숙박비',
        amount: Math.floor(Math.random() * 50000) + 80000, // 80,000 ~ 130,000
      })
    }
  }

  return items
}

/**
 * 정산 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function getSettlements(params: SettlementListParams): Promise<PaginatedResponse<Settlement>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...mockSettlements]

  // 프로그램 필터
  if (params.programId) {
    filtered = filtered.filter(settlement => settlement.programId === params.programId)
  }

  // 강사 필터
  if (params.instructorId) {
    filtered = filtered.filter(settlement => settlement.instructorId === params.instructorId)
  }

  // 매칭 필터
  if (params.matchingId) {
    filtered = filtered.filter(settlement => settlement.matchingId === params.matchingId)
  }

  // 상태 필터
  if (params.status) {
    filtered = filtered.filter(settlement => settlement.status === params.status)
  }

  // 기간 필터
  if (params.period) {
    filtered = filtered.filter(settlement => settlement.period === params.period)
  }

  // 검색 필터 (ID로 검색 - 실제로는 프로그램명, 강사명 등으로 검색해야 함)
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(settlement => settlement.id.toLowerCase().includes(searchLower))
  }

  // 정렬
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date

    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'totalAmount':
        aValue = a.totalAmount
        bValue = b.totalAmount
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // 페이지네이션
  const total = filtered.length
  const totalPages = Math.ceil(total / params.pageSize)
  const startIndex = (params.page - 1) * params.pageSize
  const endIndex = startIndex + params.pageSize
  const data = filtered.slice(startIndex, endIndex)

  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
  }
}

/**
 * 정산 상세 조회
 */
export async function getSettlementById(id: UUID): Promise<Settlement | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const settlement = mockSettlementsMap.get(id)
  if (!settlement) {
    throw new Error('정산을 찾을 수 없습니다')
  }

  return settlement
}

/**
 * 정산 생성
 */
export async function createSettlement(
  data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'documentGeneratedAt'>
): Promise<Settlement> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const newSettlement: Settlement = {
    ...data,
    id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockSettlements.push(newSettlement)
  mockSettlementsMap.set(newSettlement.id, newSettlement)

  // 그룹 업데이트
  const programSettlements = mockSettlementsByProgram.get(newSettlement.programId) || []
  programSettlements.push(newSettlement)
  mockSettlementsByProgram.set(newSettlement.programId, programSettlements)

  const instructorSettlements = mockSettlementsByInstructor.get(newSettlement.instructorId) || []
  instructorSettlements.push(newSettlement)
  mockSettlementsByInstructor.set(newSettlement.instructorId, instructorSettlements)

  const matchingSettlements = mockSettlementsByMatching.get(newSettlement.matchingId) || []
  matchingSettlements.push(newSettlement)
  mockSettlementsByMatching.set(newSettlement.matchingId, matchingSettlements)

  return newSettlement
}

/**
 * 정산 수정
 */
export async function updateSettlement(
  id: UUID,
  data: Partial<Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Settlement> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const settlement = mockSettlementsMap.get(id)
  if (!settlement) {
    throw new Error('정산을 찾을 수 없습니다')
  }

  // items가 변경된 경우 totalAmount 재계산
  let totalAmount = settlement.totalAmount
  if (data.items) {
    totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)
  }

  const updatedSettlement: Settlement = {
    ...settlement,
    ...data,
    totalAmount,
    updatedAt: new Date().toISOString(),
  }

  const index = mockSettlements.findIndex(s => s.id === id)
  if (index !== -1) {
    mockSettlements[index] = updatedSettlement
  }
  mockSettlementsMap.set(id, updatedSettlement)

  return updatedSettlement
}

/**
 * 정산 삭제
 */
export async function deleteSettlement(id: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const settlement = mockSettlementsMap.get(id)
  if (!settlement) {
    throw new Error('정산을 찾을 수 없습니다')
  }

  const index = mockSettlements.findIndex(s => s.id === id)
  if (index === -1) {
    throw new Error('정산을 찾을 수 없습니다')
  }

  mockSettlements.splice(index, 1)
  mockSettlementsMap.delete(id)

  // 그룹에서 제거
  const programSettlements = mockSettlementsByProgram.get(settlement.programId) || []
  const filteredProgram = programSettlements.filter(s => s.id !== id)
  if (filteredProgram.length > 0) {
    mockSettlementsByProgram.set(settlement.programId, filteredProgram)
  } else {
    mockSettlementsByProgram.delete(settlement.programId)
  }

  const instructorSettlements = mockSettlementsByInstructor.get(settlement.instructorId) || []
  const filteredInstructor = instructorSettlements.filter(s => s.id !== id)
  if (filteredInstructor.length > 0) {
    mockSettlementsByInstructor.set(settlement.instructorId, filteredInstructor)
  } else {
    mockSettlementsByInstructor.delete(settlement.instructorId)
  }

  const matchingSettlements = mockSettlementsByMatching.get(settlement.matchingId) || []
  const filteredMatching = matchingSettlements.filter(s => s.id !== id)
  if (filteredMatching.length > 0) {
    mockSettlementsByMatching.set(settlement.matchingId, filteredMatching)
  } else {
    mockSettlementsByMatching.delete(settlement.matchingId)
  }
}

/**
 * Excel 정산 문서 생성
 */
export async function generateSettlementExcel(settlementId: UUID): Promise<Blob> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const settlement = mockSettlementsMap.get(settlementId)
  if (!settlement) {
    throw new Error('정산을 찾을 수 없습니다')
  }

  // ExcelJS를 사용하여 Excel 문서 생성
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('정산서')

  // 헤더 스타일
  const headerStyle = {
    font: { bold: true, size: 12 },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE0E0E0' },
    },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  }

  // 제목
  worksheet.mergeCells('A1:D1')
  worksheet.getCell('A1').value = '정산서'
  worksheet.getCell('A1').font = { bold: true, size: 16 }
  worksheet.getCell('A1').alignment = { horizontal: 'center' as const }

  // 기본 정보
  worksheet.getCell('A3').value = '정산 ID'
  worksheet.getCell('B3').value = settlement.id
  worksheet.getCell('A4').value = '정산 기간'
  worksheet.getCell('B4').value = settlement.period
  worksheet.getCell('A5').value = '상태'
  worksheet.getCell('B5').value = settlement.status

  // 정산 항목 테이블 헤더
  worksheet.getCell('A7').value = '항목'
  worksheet.getCell('B7').value = '설명'
  worksheet.getCell('C7').value = '금액'
  worksheet.getCell('D7').value = '비고'

  worksheet.getRow(7).eachCell(cell => {
    cell.style = headerStyle
  })

  // 정산 항목 데이터
  settlement.items.forEach((item, index) => {
    const row = 8 + index
    worksheet.getCell(`A${row}`).value = item.type
    worksheet.getCell(`B${row}`).value = item.description
    worksheet.getCell(`C${row}`).value = item.amount
    worksheet.getCell(`C${row}`).numFmt = '#,##0'
  })

  // 합계
  const lastRow = 8 + settlement.items.length
  worksheet.getCell(`B${lastRow}`).value = '합계'
  worksheet.getCell(`B${lastRow}`).style = headerStyle
  worksheet.getCell(`C${lastRow}`).value = settlement.totalAmount
  worksheet.getCell(`C${lastRow}`).numFmt = '#,##0'
  worksheet.getCell(`C${lastRow}`).style = headerStyle

  // 컬럼 너비 조정
  worksheet.columns = [
    { width: 20 },
    { width: 30 },
    { width: 15 },
    { width: 20 },
  ]

  // Excel 파일로 변환
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * 프로그램별 정산 목록 조회
 */
export async function getSettlementsByProgram(programId: UUID): Promise<Settlement[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockSettlementsByProgram.get(programId) || []
}

/**
 * 강사별 정산 목록 조회
 */
export async function getSettlementsByInstructor(instructorId: UUID): Promise<Settlement[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockSettlementsByInstructor.get(instructorId) || []
}

/**
 * 매칭별 정산 목록 조회
 */
export async function getSettlementsByMatching(matchingId: UUID): Promise<Settlement[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockSettlementsByMatching.get(matchingId) || []
}

