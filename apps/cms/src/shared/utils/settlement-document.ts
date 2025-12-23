/**
 * 정산 문서 생성 유틸리티
 * 지급조서 Excel 생성
 */

import ExcelJS from 'exceljs'
import type { Settlement, Instructor } from '@/types/domain'
import { downloadExcel, generateFilename } from './file-download'
import dayjs from 'dayjs'

/**
 * 강사 지급 정보 (Mock 데이터용)
 * 실제로는 Instructor 타입에 추가하거나 별도로 관리
 */
interface InstructorPaymentInfo {
  name: string
  phone: string
  bankAccount: string
  residentRegistrationNumber?: string // 주민등록번호 (민감정보)
  personalInfoConsent?: boolean // 개인정보 동의 여부
}

/**
 * 지급조서 Excel 생성
 */
export async function generatePaymentStatement(
  settlement: Settlement,
  instructor: Instructor,
  programTitle: string,
  paymentInfo?: Partial<InstructorPaymentInfo>
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('지급조서')

  // 기본 스타일 설정
  const headerStyle = {
    font: { bold: true, size: 12 },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE0E0E0' },
    },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  }

  const cellStyle = {
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  }

  // 제목
  worksheet.mergeCells('A1:F1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = '지급조서'
  titleCell.font = { bold: true, size: 16 }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(1).height = 30

  // 기본 정보 섹션
  let currentRow = 3

  // 기간
  worksheet.getCell(`A${currentRow}`).value = '기간'
  worksheet.getCell(`A${currentRow}`).style = headerStyle
  worksheet.getCell(`B${currentRow}`).value = settlement.period
  worksheet.getCell(`B${currentRow}`).style = cellStyle
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`)

  // 프로그램명
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = '프로그램명'
  worksheet.getCell(`A${currentRow}`).style = headerStyle
  worksheet.getCell(`B${currentRow}`).value = programTitle
  worksheet.getCell(`B${currentRow}`).style = cellStyle
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`)

  // 강사 정보 섹션
  currentRow += 2
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`)
  const instructorHeaderCell = worksheet.getCell(`A${currentRow}`)
  instructorHeaderCell.value = '강사 정보'
  instructorHeaderCell.style = headerStyle
  instructorHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' }

  currentRow++
  const instructorInfo = [
    { label: '이름', value: paymentInfo?.name || instructor.name },
    { label: '전화번호', value: paymentInfo?.phone || instructor.contactPhone || '-' },
    { label: '계좌번호', value: paymentInfo?.bankAccount || instructor.bankAccount || '-' },
    {
      label: '주민등록번호',
      value: paymentInfo?.residentRegistrationNumber || '-',
    },
  ]

  instructorInfo.forEach((info, index) => {
    const row = currentRow + index
    worksheet.getCell(`A${row}`).value = info.label
    worksheet.getCell(`A${row}`).style = headerStyle
    worksheet.getCell(`B${row}`).value = info.value
    worksheet.getCell(`B${row}`).style = cellStyle
    worksheet.mergeCells(`B${row}:C${row}`)
  })

  currentRow += instructorInfo.length + 1

  // 개인정보 동의 확인
  worksheet.getCell(`A${currentRow}`).value = '개인정보 동의'
  worksheet.getCell(`A${currentRow}`).style = headerStyle
  worksheet.getCell(`B${currentRow}`).value = paymentInfo?.personalInfoConsent ? '동의함' : '동의 안함'
  worksheet.getCell(`B${currentRow}`).style = cellStyle
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`)

  // 정산 항목 섹션
  currentRow += 2
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`)
  const itemsHeaderCell = worksheet.getCell(`A${currentRow}`)
  itemsHeaderCell.value = '정산 항목'
  itemsHeaderCell.style = headerStyle
  itemsHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' }

  currentRow++
  // 테이블 헤더
  const itemHeaders = ['항목', '설명', '금액']
  itemHeaders.forEach((header, colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex + 1)
    cell.value = header
    cell.style = headerStyle
  })
  worksheet.getRow(currentRow).height = 25

  // 정산 항목 데이터
  const itemTypeLabels: Record<string, string> = {
    instructor_fee: '강사비',
    transportation: '교통비',
    accommodation: '숙박비',
    other: '기타',
  }

  settlement.items.forEach((item) => {
    currentRow++
    worksheet.getCell(currentRow, 1).value = itemTypeLabels[item.type] || item.type
    worksheet.getCell(currentRow, 1).style = cellStyle
    worksheet.getCell(currentRow, 2).value = item.description
    worksheet.getCell(currentRow, 2).style = cellStyle
    worksheet.getCell(currentRow, 3).value = item.amount
    worksheet.getCell(currentRow, 3).style = {
      ...cellStyle,
      numFmt: '#,##0',
      alignment: { vertical: 'middle', horizontal: 'right' },
    }
  })

  // 총액
  currentRow++
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = '총액'
  worksheet.getCell(`A${currentRow}`).style = {
    ...headerStyle,
    alignment: { vertical: 'middle', horizontal: 'right' },
  }
  worksheet.getCell(`C${currentRow}`).value = settlement.totalAmount
  worksheet.getCell(`C${currentRow}`).style = {
    ...headerStyle,
    numFmt: '#,##0',
    alignment: { vertical: 'middle', horizontal: 'right' },
  }

  // 열 너비 조정
  worksheet.getColumn(1).width = 20
  worksheet.getColumn(2).width = 30
  worksheet.getColumn(3).width = 20
  worksheet.getColumn(4).width = 15
  worksheet.getColumn(5).width = 15
  worksheet.getColumn(6).width = 15

  // Excel 파일 생성 및 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = generateFilename(
    `지급조서_${instructor.name}_${settlement.period}`,
    'xlsx',
    dayjs(settlement.documentGeneratedAt || settlement.createdAt).toDate()
  )
  downloadExcel(buffer, filename)
}

