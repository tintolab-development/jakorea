/**
 * 매칭 현황 훅
 * Phase 4.4: 매칭 관리 (FR-F03)
 * Task 3.3.2: filters 기반 조회, 캘린더/목록 데이터 동기화
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  getMatchingStatusList,
  type MatchingStatusItem,
  type MatchingStatusFilters,
} from '@/entities/matching/api/matching-status-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'

export interface UseMatchingStatusOptions {
  /** 기간 등 필터. 설정 시 해당 조건으로 조회하며, 캘린더/목록이 동일 데이터 사용 */
  filters?: MatchingStatusFilters | null
}

interface UseMatchingStatusResult {
  statusItems: MatchingStatusItem[]
  /** 날짜별 그룹 (캘린더 뷰용) */
  calendarData: Record<string, MatchingStatusItem[]>
  loading: boolean
  fetchStatusList: (filters?: MatchingStatusFilters) => Promise<void>
  exportToExcel: () => Promise<void>
}

export function useMatchingStatus(
  options: UseMatchingStatusOptions = {}
): UseMatchingStatusResult {
  const { filters = null } = options
  const [statusItems, setStatusItems] = useState<MatchingStatusItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStatusList = useCallback(
    async (overrideFilters?: MatchingStatusFilters) => {
      setLoading(true)
      try {
        const f = overrideFilters ?? filters ?? undefined
        const data = await getMatchingStatusList(f)
        setStatusItems(data)
      } catch (error) {
        handleError(error, { defaultMessage: '매칭 현황을 불러오는데 실패했습니다' })
      } finally {
        setLoading(false)
      }
    },
    // filters 변경 시 fetchStatusList 갱신 (useEffect에서 호출)
    [filters]
  )

  const calendarData = useMemo(() => {
    const grouped: Record<string, MatchingStatusItem[]> = {}
    for (const item of statusItems) {
      if (!grouped[item.date]) grouped[item.date] = []
      grouped[item.date].push(item)
    }
    return grouped
  }, [statusItems])

  useEffect(() => {
    if (filters) fetchStatusList()
  }, [fetchStatusList, filters])

  const exportToExcel = useCallback(async () => {
    if (statusItems.length === 0) {
      handleError(new Error('다운로드할 매칭 현황이 없습니다.'), {
        defaultMessage: '다운로드할 매칭 현황이 없습니다.',
      })
      return
    }
    try {
      const ExcelJS = (await import('@zurmokeeper/exceljs')).default
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

  return {
    statusItems,
    calendarData,
    loading,
    fetchStatusList,
    exportToExcel,
  }
}
