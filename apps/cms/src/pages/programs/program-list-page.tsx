/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useProgramStore } from '@/features/program/model/program-store'
import { message } from 'antd'
import type { Program } from '@/types/domain'

export function ProgramListPage() {
  const navigate = useNavigate()
  const { programs, loading, fetchPrograms, deleteProgram } = useProgramStore()
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const handleView = (program: Program) => {
    setSelectedProgram(program)
    setDrawerOpen(true)
  }

  const handleEdit = (program: Program) => {
    navigate(`/programs/${program.id}/edit`)
  }

  const handleDeleteClick = (program: Program) => {
    setProgramToDelete(program)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return

    try {
      await deleteProgram(programToDelete.id)
      message.success('프로그램이 삭제되었습니다')
      setDeleteModalOpen(false)
      setProgramToDelete(null)
      if (selectedProgram?.id === programToDelete.id) {
        setDrawerOpen(false)
        setSelectedProgram(null)
      }
    } catch {
      message.error('삭제 중 오류가 발생했습니다')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>프로그램 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/programs/new')}>
          프로그램 등록
        </Button>
      </Space>

      <ProgramList
        data={programs}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <ProgramDetailDrawer
        open={drawerOpen}
        program={selectedProgram}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedProgram(null)
        }}
        onEdit={() => {
          if (selectedProgram) {
            setDrawerOpen(false)
            handleEdit(selectedProgram)
          }
        }}
        onDelete={() => {
          if (selectedProgram) {
            setDrawerOpen(false)
            handleDeleteClick(selectedProgram)
          }
        }}
        loading={loading}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="프로그램 삭제"
        content="정말 이 프로그램을 삭제하시겠습니까? 관련된 신청, 일정, 매칭 정보도 함께 삭제될 수 있습니다."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false)
          setProgramToDelete(null)
        }}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

