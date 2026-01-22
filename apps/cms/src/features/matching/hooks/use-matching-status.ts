/**
 * 매칭 현황 훅
 * Phase 4.4: 매칭 관리 (FR-F03)
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getMatchingStatusList,
  type MatchingStatusItem,
  type MatchingStatusFilters,
} from '@/entities/matching/api/matching-status-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'

interface UseMatchingStatusResult {
  statusItems: MatchingStatusItem[]
  loading: boolean
  fetchStatusList: (filters?: MatchingStatusFilters) => Promise<void>
  exportToExcel: () => Promise<void>
}

export function useMatchingStatus(): UseMatchingStatusResult {
  const [statusItems, setStatusItems] = useState<MatchingStatusItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStatusList = useCallback(async (filters?: MatchingStatusFilters) => {
    setLoading(true)
    try {
      const data = await getMatchingStatusList(filters)
      setStatusItems(data)
    } catch (error) {
      handleError(error, { defaultMessage: '매칭 현황을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [])

  const exportToExcel = useCallback(async () => {
    if (statusItems.length === 0) {
      handleError(new Error('다운로드할 매칭 현황이 없습니다.'), {
        defaultMessage: '다운로드할 매칭 현황이 없습니다.',
      })
      return
    }
    try {
      const ExcelJS = (await import('exceljs')).default
      const { saveAs } = await import('file-saver')

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('매칭 현황')

      // 컬럼 정의
      sheet.columns = [
        { header: '날짜', key: 'date', width: 15 },
        { header: '학교명', key: 'schoolName', width: 20 },
        { header: '프로그램명', key: 'programName', width: 30 },
        { header: '강사', key: 'instructors', width: 30 },
        { header: '상태', key: 'status', width: 15 },
      ]

      // 데이터 추가
      statusItems.forEach(item => {
        const instructorNames = item.instructors
          .map(inst => `${inst.name}(${inst.role === 'LEAD' ? '대표' : '보조'})`)
          .join(', ')

        const statusLabel =
          item.status === 'PENDING'
            ? '대기'
            : item.status === 'CONFIRMED'
              ? '확정'
              : '완료'

        sheet.addRow({
          date: new Date(item.date).toLocaleDateString('ko-KR'),
          schoolName: item.schoolName,
          programName: item.programName,
          instructors: instructorNames,
          status: statusLabel,
        })
      })

      // 스타일 적용
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).alignment = { horizontal: 'center' }

      // 파일 생성 및 다운로드
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `매칭현황_${new Date().toISOString().split('T')[0]}.xlsx`)
      showSuccessMessage('매칭 현황 엑셀 다운로드가 완료되었습니다.')
    } catch (error) {
      handleError(error, { defaultMessage: '엑셀 다운로드 중 오류가 발생했습니다' })
    }
  }, [statusItems])

  useEffect(() => {
    fetchStatusList()
  }, [fetchStatusList])

  return {
    statusItems,
    loading,
    fetchStatusList,
    exportToExcel,
  }
}
