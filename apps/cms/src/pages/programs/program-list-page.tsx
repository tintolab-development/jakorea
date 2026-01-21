/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 * 프로그램 등록을 모달로 변경
 */

import { useState, useEffect, useMemo } from 'react'
import { Button, Space, Modal, message, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramForm } from '@/features/program/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './program-list-page.css'
import type { Program, ProgramLifecycleStatus, ProgramCategory } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useProgramStatusManager } from '@/features/program/hooks/use-program-status-manager'

export function ProgramListPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs, loading, fetchPrograms, deleteProgram, updateProgram, createProgram, selectedProgram, setSelectedProgram } = useProgramStore()
  const { changeStatus: changeProgramStatus } = useProgramStatusManager()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // 관리자만 프로그램 등록 가능
  const isAdmin = user?.role === 'ADMIN'
  // 강사/봉사자/학생용
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'VOLUNTEER' || user?.role === 'STUDENT'

  // 카테고리명 가져오기
  const categoryName = isAdmin
    ? '프로그램 관리'
    : getCategoryNameByPath(location.pathname, 1) || '진행 프로그램'

  // 탭 필터 (강사용)
  const categoryTab = (searchParams.get('category') as ProgramCategory | 'all') || 'all'

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  // 강사용: 신청 가능한 프로그램 및 수강자 모집 완료 프로그램 필터링 + 카테고리 필터
  const filteredPrograms = useMemo(() => {
    let filtered = programs

    // 강사용일 경우 신청 가능한 프로그램과 수강자 모집 완료 프로그램 표시
    if (isUserRole && !isAdmin) {
      filtered = filtered.filter(program => {
        // 신청 가능한 상태와 수강자 모집 완료된 프로그램만 표시
        const availableStatuses: ProgramLifecycleStatus[] = [
          'recruiting_students', // 수강자 모집 중 (신청 가능)
          'recruiting_instructors', // 강사 모집 중 (신청 가능)
          'recruitment_completed_waiting', // 수강자 모집 완료 및 대기 중
          'matching_completed_waiting', // 매칭 완료 및 진행 대기 중
          'in_progress', // 진행 중
          'completed', // 진행 완료
        ]
        return (
          program.lifecycleStatus &&
          availableStatuses.includes(program.lifecycleStatus)
        )
      })
    }

    // 카테고리 필터 (강사용)
    if (isUserRole && categoryTab !== 'all') {
      filtered = filtered.filter(program => program.category === categoryTab)
    }

    return filtered
  }, [programs, isUserRole, isAdmin, categoryTab])

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
    await changeProgramStatus(program.id, status)
  }

  const handleCategoryTabChange = (category: ProgramCategory | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (category === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', category)
    }
    setSearchParams(newParams, { replace: true })
  }

  return (
    <div>
      <Space className="program-list-header">
        <h1 className="program-list-title">{categoryName}</h1>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            프로그램 등록
          </Button>
        )}
      </Space>

      {/* 강사용: 개인/단체 탭 */}
      {isUserRole && !isAdmin && (
        <Tabs
          activeKey={categoryTab}
          onChange={(key) => handleCategoryTabChange(key as ProgramCategory | 'all')}
          items={[
            {
              key: 'all',
              label: '전체',
            },
            {
              key: 'individual',
              label: '개인 학생 대상 프로그램',
            },
            {
              key: 'school',
              label: '단체(학교) 대상 프로그램',
            },
          ]}
          style={{ marginBottom: 16 }}
        />
      )}

      <ProgramList
        data={filteredPrograms}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        showActions={isAdmin} // 관리자만 작업 컬럼 표시
        showFavorite={false} // 찜하기는 상세 패널에서만 제공
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
        hideActions={!isAdmin} // 관리자가 아니면 수정/삭제 버튼 숨김
      />

      <Modal
        open={formModalOpen}
        title={editingProgram ? '프로그램 수정' : '프로그램 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={900}
        destroyOnHidden
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

