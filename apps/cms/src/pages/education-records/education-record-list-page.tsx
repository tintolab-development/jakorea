/**
 * 교육실적 목록 페이지
 * 엑셀 데이터 기반 통합 테이블 - 모든 컬럼 관리
 */

import { useEffect } from 'react'
import { Space } from 'antd'
import { EducationRecordList } from '@/features/education-record/ui/education-record-list'
import { useEducationRecordStore } from '@/features/education-record/model/education-record-store'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { useState } from 'react'
import type { Program } from '@/types/domain'
import { useProgramStore } from '@/features/program/model/program-store'

export function EducationRecordListPage() {
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
        <h1 style={{ margin: 0 }}>교육실적 관리</h1>
      </Space>

      <EducationRecordList
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
          // 교육실적은 수정 기능 없음 (읽기 전용)
        }}
        onDelete={() => {
          // 교육실적은 삭제 기능 없음 (읽기 전용)
        }}
        loading={loading}
        hideActions={true}
      />
    </div>
  )
}

