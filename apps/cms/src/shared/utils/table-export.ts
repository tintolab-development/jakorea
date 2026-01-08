/**
 * 테이블 데이터 엑셀 다운로드 유틸리티
 */

import ExcelJS from 'exceljs'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import { downloadExcel, generateFilename } from './file-download'

/**
 * 테이블 데이터를 엑셀로 내보내기
 * @param columns - Ant Design Table의 columns 정의
 * @param dataSource - 테이블 데이터 배열
 * @param filename - 파일명 (확장자 제외)
 */
export async function exportTableToExcel<T extends Record<string, any>>(
  columns: ColumnsType<T>,
  dataSource: T[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  // 헤더 스타일
  const headerStyle = {
    font: { bold: true, size: 11 },
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

  // 데이터 스타일
  const cellStyle = {
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
    alignment: { vertical: 'middle' as const } as const,
  }

  // 헤더 행 생성
  const headerRow = worksheet.addRow(
    columns
      .filter(col => col.key !== 'action' && !col.hidden)
      .map(col => col.title as string)
  )
  headerRow.eachCell(cell => {
    cell.style = headerStyle
  })

  // 데이터 행 생성
  dataSource.forEach(rowData => {
    const rowValues = columns
      .filter((col): col is ColumnType<T> => 'dataIndex' in col && col.key !== 'action' && !col.hidden)
      .map(col => {
        const dataIndex = col.dataIndex
        if (!dataIndex) return ''

        // dataIndex가 배열인 경우 (예: ['user', 'name'])
        if (Array.isArray(dataIndex)) {
          let value: any = rowData
          for (const key of dataIndex) {
            value = value?.[key]
          }
          return formatCellValue(value, col)
        }

        // dataIndex가 문자열인 경우
        if (typeof dataIndex === 'string') {
          return formatCellValue(rowData[dataIndex], col)
        }

        return ''
      })

    const row = worksheet.addRow(rowValues)
    row.eachCell(cell => {
      cell.style = cellStyle
    })
  })

  // 컬럼 너비 자동 조정
  worksheet.columns.forEach((column, index) => {
    if (column && column.header) {
      const headerLength = String(column.header).length
      const maxDataLength = Math.max(
        ...dataSource.map(row => {
          const col = columns[index]
          if (!col || !('dataIndex' in col) || col.key === 'action' || col.hidden) return 0
          const dataIndex = col.dataIndex
          let value: any = ''
          if (Array.isArray(dataIndex)) {
            let val: any = row
            for (const key of dataIndex) {
              val = val?.[key]
            }
            value = val
          } else if (typeof dataIndex === 'string') {
            value = row[dataIndex]
          }
          return String(formatCellValue(value, col)).length
        })
      )
      column.width = Math.min(Math.max(headerLength, maxDataLength) + 2, 50)
    }
  })

  // 엑셀 파일 생성 및 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const fullFilename = generateFilename(filename, 'xlsx')
  downloadExcel(buffer, fullFilename)
}

/**
 * 셀 값 포맷팅
 */
function formatCellValue(value: any, column: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  // render 함수가 있는 경우는 원본 데이터를 반환 (태그 등 제거)
  if (column.render) {
    // render 함수가 있으면 원본 값을 반환
    return String(value)
  }

  // 날짜 형식 처리
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  // 숫자 형식 처리
  if (typeof value === 'number') {
    return String(value)
  }

  // 객체나 배열인 경우 JSON 문자열로 변환
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
