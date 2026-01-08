/**
 * 실적 통계 목록 페이지 (v2)
 * 핵심 컬럼만 표시, 상세 정보는 상세 패널에서 확인
 */

import { useEffect } from 'react'
import { Space } from 'antd'
import { EducationRecordListV2 } from '@/features/education-record/ui/education-record-list-v2'
import { useEducationRecordStore } from '@/features/education-record/model/education-record-store'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { useState } from 'react'
import type { Program } from '@/types/domain'
import { useProgramStore } from '@/features/program/model/program-store'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'

export function EducationRecordListPageV2() {
  const { records, loading, fetchRecords } = useEducationRecordStore()
  const { setSelectedProgram } = useProgramStore()
  const [selectedRecord, setSelectedRecord] = useState<Program | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleView = (record: Program) => {
    setSelectedRecord(record)
    setSelectedProgram(record) // store에 동기화
    setDrawerOpen(true)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>실적 통계</h1>
      </Space>

      <EducationRecordListV2
        data={records}
        loading={loading}
        onView={handleView}
      />

      <ProgramDetailDrawer
        open={drawerOpen}
        program={selectedRecord}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedRecord(null)
        }}
        onEdit={() => {
          // 실적 통계는 수정 기능 없음 (읽기 전용)
        }}
        onDelete={() => {
          // 실적 통계는 삭제 기능 없음 (읽기 전용)
        }}
        loading={loading}
        hideActions={true}
      />
    </div>
  )
}

