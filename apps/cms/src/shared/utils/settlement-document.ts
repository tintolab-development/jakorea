/**
 * 정산 문서 생성 유틸리티
 * 지급조서 Excel/PDF 생성
 * V3 Phase 4: PDF 생성 기능 추가
 */

// @ts-ignore - @zurmokeeper/exceljs 타입 선언 문제
import ExcelJS from '@zurmokeeper/exceljs'
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
 * 이체리스트 행 정보
 * FR-G03: 은행 전송용 포맷 지원을 위해 bankName 필드 추가
 */
export interface TransferListRow {
  period: string
  programTitle: string
  instructorName: string
  bankAccount: string
  bankName?: string // FR-G03: 은행명 (선택)
  amount: number
}

/**
 * 지급조서 생성 (Excel 또는 PDF)
 * @param format 'excel' | 'pdf' (기본값: 'excel')
 */
export async function generatePaymentStatement(
  settlement: Settlement,
  instructor: Instructor,
  programTitle: string,
  paymentInfo?: Partial<InstructorPaymentInfo>,
  format: 'excel' | 'pdf' = 'excel'
): Promise<void> {
  if (format === 'pdf') {
    return generatePaymentStatementPDF(settlement, instructor, programTitle, paymentInfo)
  }
  return generatePaymentStatementExcel(settlement, instructor, programTitle, paymentInfo)
}

/**
 * 지급조서 Excel 생성
 */
async function generatePaymentStatementExcel(
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

/**
 * 지급조서 PDF 생성
 * V3 Phase 4: PDF 생성 기능 추가
 * TODO: jsPDF 라이브러리 설치 후 실제 PDF 생성 구현
 */
async function generatePaymentStatementPDF(
  settlement: Settlement,
  instructor: Instructor,
  programTitle: string,
  paymentInfo?: Partial<InstructorPaymentInfo>
): Promise<void> {
  // TODO: jsPDF 라이브러리 설치 후 실제 PDF 생성 구현
  // 현재는 HTML을 PDF로 변환하는 방식으로 Mock 구현
  
  // PDF 콘텐츠 생성 (HTML 기반)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>지급조서</title>
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .total { font-weight: bold; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>지급조서</h1>
      <table>
        <tr><th>기간</th><td>${settlement.period}</td></tr>
        <tr><th>프로그램명</th><td>${programTitle}</td></tr>
        <tr><th>강사명</th><td>${paymentInfo?.name || instructor.name}</td></tr>
        <tr><th>전화번호</th><td>${paymentInfo?.phone || instructor.contactPhone || '-'}</td></tr>
        <tr><th>계좌번호</th><td>${paymentInfo?.bankAccount || instructor.bankAccount || '-'}</td></tr>
        ${paymentInfo?.residentRegistrationNumber ? `<tr><th>주민등록번호</th><td>${paymentInfo.residentRegistrationNumber}</td></tr>` : ''}
        <tr><th>개인정보 동의</th><td>${paymentInfo?.personalInfoConsent ? '동의함' : '동의 안함'}</td></tr>
      </table>
      <h2>정산 항목</h2>
      <table>
        <tr>
          <th>항목</th>
          <th>설명</th>
          <th>금액</th>
        </tr>
        ${settlement.items.map(item => `
          <tr>
            <td>${getItemTypeLabel(item.type)}</td>
            <td>${item.description}</td>
            <td>${item.amount.toLocaleString('ko-KR')}원</td>
          </tr>
        `).join('')}
        <tr class="total">
          <td colspan="2">총액</td>
          <td>${settlement.totalAmount.toLocaleString('ko-KR')}원</td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  // HTML을 Blob으로 변환하여 다운로드
  // 실제로는 jsPDF를 사용하여 PDF를 생성해야 함
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const filename = generateFilename(
    `지급조서_${instructor.name}_${settlement.period}`,
    'html', // 임시로 HTML로 저장 (실제로는 PDF)
    dayjs(settlement.documentGeneratedAt || settlement.createdAt).toDate()
  )
  
  // TODO: 실제 PDF 생성 시 downloadPDF 사용
  // 현재는 HTML로 다운로드 (개발 중)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function getItemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    instructor_fee: '강사비',
    transportation: '교통비',
    accommodation: '숙박비',
    other: '기타',
  }
  return labels[type] || type
}

/**
 * Phase 0.4.3: 이체리스트 Excel 생성
 * FR-G03: 은행 전송용 표준 포맷 적용
 * 암호화: ExcelJS는 기본적으로 workbook 암호화를 지원하지 않음
 * 실제 구현 시 @zurmokeeper/exceljs 또는 xlsx-populate Encryptor 사용 필요
 */
export async function generateTransferList(
  rows: TransferListRow[],
  options: { passwordProvided: boolean; password?: string; format?: 'standard' | 'bank' }
): Promise<void> {
  const format = options.format || 'standard'
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('이체리스트')

  // FR-G03: 은행 전송용 표준 포맷
  if (format === 'bank') {
    // 은행 이체 파일 표준 포맷: 계좌번호, 예금주명, 은행명, 금액, 통장인자(메모)
    worksheet.columns = [
      { header: '계좌번호', key: 'bankAccount', width: 20 },
      { header: '예금주명', key: 'instructorName', width: 20 },
      { header: '은행명', key: 'bankName', width: 15 },
      { header: '금액', key: 'amount', width: 18 },
      { header: '통장인자', key: 'memo', width: 40 },
    ]

    rows.forEach(row => {
      // 계좌번호에서 은행명 추출 (예: "110-123-456789" -> "국민은행")
      // 실제로는 Settlement 데이터에서 bankName을 가져와야 함
      const bankName = extractBankName(row.bankAccount) || '기타'
      const memo = `${row.period} ${row.programTitle}`

      worksheet.addRow({
        bankAccount: row.bankAccount.replace(/-/g, ''), // 하이픈 제거
        instructorName: row.instructorName,
        bankName,
        amount: row.amount,
        memo,
      })
    })

    worksheet.getRow(1).font = { bold: true }
    worksheet.getColumn('amount').numFmt = '#,##0'
    
    // 합계 행 추가
    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
    const summaryRow = worksheet.addRow({
      bankAccount: '',
      instructorName: '',
      bankName: '합계',
      amount: totalAmount,
      memo: `총 ${rows.length}건`,
    })
    summaryRow.font = { bold: true }
  } else {
    // 기본 포맷 (기존)
    worksheet.columns = [
      { header: '기간', key: 'period', width: 12 },
      { header: '프로그램', key: 'programTitle', width: 30 },
      { header: '강사', key: 'instructorName', width: 16 },
      { header: '계좌번호', key: 'bankAccount', width: 26 },
      { header: '금액', key: 'amount', width: 16 },
    ]

    rows.forEach(row => {
      worksheet.addRow({
        period: row.period,
        programTitle: row.programTitle,
        instructorName: row.instructorName,
        bankAccount: row.bankAccount,
        amount: row.amount,
      })
    })

    worksheet.getRow(1).font = { bold: true }
    worksheet.getColumn('amount').numFmt = '#,##0'

    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
    const summaryRow = worksheet.addRow({
      programTitle: '합계',
      amount: totalAmount,
    })
    summaryRow.font = { bold: true }
  }

  // Phase 0.4.3: 암호화 처리 (@zurmokeeper/exceljs 암호화 지원)
  const filename = generateFilename(
    `이체리스트${options.passwordProvided ? '_protected' : ''}`,
    'xlsx',
    dayjs().toDate()
  )
  
  try {
    if (options.passwordProvided && options.password) {
      // Phase 0.4.3: @zurmokeeper/exceljs는 writeBuffer에 password 옵션 지원
      // 암호화 옵션: { password: string }
      if (options.password.length < 8) {
        throw new Error('암호는 최소 8자 이상이어야 합니다.')
      }
      
      const buffer = await workbook.xlsx.writeBuffer({ 
        password: options.password 
      })
      
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('암호화된 Excel 파일 생성에 실패했습니다.')
      }
      
      downloadExcel(buffer, filename)
    } else {
      const buffer = await workbook.xlsx.writeBuffer()
      
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('Excel 파일 생성에 실패했습니다.')
      }
      
      downloadExcel(buffer, filename)
    }
  } catch (error: any) {
    console.error('Excel 파일 생성 실패:', error)
    
    // Phase 0.4.3: 에러 타입별 메시지 구분
    if (error?.message) {
      throw error
    }
    
    // 일반적인 에러 메시지
    throw new Error(
      options.passwordProvided
        ? '암호화된 Excel 파일 생성 중 오류가 발생했습니다. 암호를 확인해주세요.'
        : 'Excel 파일 생성 중 오류가 발생했습니다.'
    )
  }
}

/**
 * 계좌번호에서 은행명 추출 (간단한 휴리스틱)
 * FR-G03: 실제로는 Settlement 데이터에서 bankName을 가져와야 함
 */
function extractBankName(accountNumber: string): string | null {
  // 계좌번호 앞자리로 은행 추정 (간단한 예시)
  const bankPrefixMap: Record<string, string> = {
    '110': '국민은행',
    '004': 'KB국민은행',
    '088': '신한은행',
    '020': '우리은행',
    '011': 'NH농협은행',
    '088': '신한은행',
    '081': '하나은행',
    '003': '기업은행',
    '027': '한국시티은행',
    '023': 'SC제일은행',
    '037': '전북은행',
    '032': '대구은행',
    '034': '광주은행',
    '071': '우체국',
  }

  const prefix = accountNumber.replace(/-/g, '').substring(0, 3)
  return bankPrefixMap[prefix] || null
}

