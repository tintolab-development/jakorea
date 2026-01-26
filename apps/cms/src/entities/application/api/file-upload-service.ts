/**
 * 파일 업로드 Mock 서비스
 * Phase 0.2.2: 학교 신청서 엑셀 업로드 (FR-C03)
 * Phase 0.2.2 수정: 엑셀 파일 파싱 및 검증 기능 추가
 */

// @ts-expect-error - @zurmokeeper/exceljs 타입 선언 문제
import ExcelJS from '@zurmokeeper/exceljs'

/**
 * 파일 업로드 결과
 */
export interface FileUploadResult {
  url: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

/**
 * 학생 명단 파싱 결과 (FR-C03)
 */
export interface StudentListParseResult {
  students: Array<{
    name: string
    grade?: string
    class?: string
    studentNumber?: string
  }>
  totalCount: number
  errors: string[]
}

/**
 * 파일 업로드 Mock 서비스
 * 실제 환경에서는 서버로 파일을 전송하고 URL을 받아옴
 */
export const fileUploadService = {
  /**
   * 파일 업로드 (Mock)
   * 실제로는 서버로 파일을 전송하고 저장된 URL을 반환
   */
  upload: async (file: File, type: 'studentList' | 'document'): Promise<FileUploadResult> => {
    // Mock: 비동기 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock URL 생성 (실제로는 서버에서 반환)
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const extension = file.name.substring(file.name.lastIndexOf('.'))
    const url = `/uploads/${type}/${fileId}${extension}`

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }
  },

  /**
   * 여러 파일 업로드
   */
  uploadMultiple: async (
    files: File[],
    type: 'studentList' | 'document'
  ): Promise<FileUploadResult[]> => {
    return Promise.all(files.map(file => fileUploadService.upload(file, type)))
  },

  /**
   * 학생 명단 엑셀 파일 파싱 (FR-C03)
   * 엑셀 파일을 읽어서 학생 정보를 추출
   */
  parseStudentList: async (file: File): Promise<StudentListParseResult> => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)

      // 첫 번째 시트 사용
      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('엑셀 파일에 시트가 없습니다.')
      }

      const students: StudentListParseResult['students'] = []
      const errors: string[] = []

      // 헤더 행 찾기 (첫 번째 행이 헤더일 것으로 가정)
      const headerRow = worksheet.getRow(1)
      const headerMap: Record<string, number> = {}
      
      headerRow.eachCell((cell, colNumber) => {
        const headerText = cell.text?.toLowerCase().trim() || ''
        if (headerText.includes('이름') || headerText.includes('name')) {
          headerMap.name = colNumber
        } else if (headerText.includes('학년') || headerText.includes('grade')) {
          headerMap.grade = colNumber
        } else if (headerText.includes('반') || headerText.includes('class')) {
          headerMap.class = colNumber
        } else if (headerText.includes('번호') || headerText.includes('number')) {
          headerMap.studentNumber = colNumber
        }
      })

      // 이름 컬럼이 없으면 오류
      if (!headerMap.name) {
        throw new Error('엑셀 파일에 "이름" 컬럼이 없습니다.')
      }

      // 데이터 행 파싱 (2번째 행부터)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // 헤더 행 스킵

        const name = row.getCell(headerMap.name).text?.trim()
        if (!name) return // 이름이 없으면 스킵

        const student = {
          name,
          grade: headerMap.grade ? row.getCell(headerMap.grade).text?.trim() : undefined,
          class: headerMap.class ? row.getCell(headerMap.class).text?.trim() : undefined,
          studentNumber: headerMap.studentNumber ? row.getCell(headerMap.studentNumber).text?.trim() : undefined,
        }

        students.push(student)
      })

      return {
        students,
        totalCount: students.length,
        errors: errors.length > 0 ? errors : [],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '엑셀 파일 파싱에 실패했습니다.'
      throw new Error(errorMessage)
    }
  },
}
