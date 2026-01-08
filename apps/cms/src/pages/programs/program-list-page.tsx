/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 * 프로그램 등록을 모달로 변경
 */

import { useState, useEffect } from 'react'
import { Button, Space, Modal, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramForm } from '@/features/program/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'

export function ProgramListPage() {
  const { user } = useAuthStore()
  const { programs, loading, fetchPrograms, deleteProgram, updateProgram, createProgram, selectedProgram, setSelectedProgram } = useProgramStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // 관리자만 프로그램 등록 가능
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const handleView = (program: Program) => {
    setSelectedProgram(program) // store에 동기화
    setDrawerOpen(true)
  }

  const handleEdit = (program: Program) => {
    setEditingProgram(program)
    setDrawerOpen(false)
    setFormModalOpen(true)
  }

  const handleNewClick = () => {
    setEditingProgram(null)
    setFormModalOpen(true)
  }

  const handleFormSubmit = async (data: ProgramFormData) => {
    setFormLoading(true)
    try {
      // ProgramFormData를 Program 타입으로 변환
      const programData = {
        ...data,
        rounds: data.rounds.map((round, index) => ({
          ...round,
          id: editingProgram
            ? editingProgram.rounds[index]?.id || `round-${index + 1}`
            : `round-${index + 1}`,
          programId: editingProgram?.id || '', // create 시에는 서비스에서 처리
        })),
      }

      if (editingProgram) {
        await updateProgram(editingProgram.id, programData)
        showSuccessMessage('프로그램 정보가 수정되었습니다')
      } else {
        await createProgram(programData as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>)
        showSuccessMessage('프로그램이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingProgram(null)
      fetchPrograms()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingProgram ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'ProgramFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingProgram(null)
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

  const handleStatusChange = async (program: Program, status: ProgramLifecycleStatus) => {
    try {
      await updateProgram(program.id, { lifecycleStatus: status })
      message.success('프로그램 상태가 변경되었습니다')
    } catch {
      message.error('상태 변경 중 오류가 발생했습니다')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>프로그램 관리</h1>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            프로그램 등록
          </Button>
        )}
      </Space>

      <ProgramList
        data={programs}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        showActions={isAdmin} // 관리자만 작업 컬럼 표시
        onChangeStatus={isAdmin ? handleStatusChange : undefined}
      />

      <ProgramDetailDrawer
        open={drawerOpen}
        program={selectedProgram || null}
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

      <Modal
        open={formModalOpen}
        title={editingProgram ? '프로그램 수정' : '프로그램 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={900}
        destroyOnClose
      >
        <ProgramForm
          program={editingProgram || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

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

// default export 추가 (lazy loading 호환성)
export default ProgramListPage

