/**
 * 실적 통계 목록 페이지
 * 엑셀 데이터 기반 통합 테이블 - 모든 컬럼 관리
 */

import { useEffect } from 'react'
import { EducationRecordList } from '@/features/education-record/ui/education-record-list'
import { useEducationRecordStore } from '@/features/education-record/model/education-record-store'

export function EducationRecordListPage() {
  const { records, loading, fetchRecords } = useEducationRecordStore()

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <div>
      <EducationRecordList data={records} loading={loading} />
    </div>
  )
}
