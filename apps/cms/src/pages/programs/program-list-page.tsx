/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 * 프로그램 등록을 모달로 변경
 */

import { useState, useEffect, useMemo } from 'react'
import { Space, Modal, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramForm } from '@/features/program/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PermissionButton } from '@/shared/components/permission-button'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import './program-list-page.css'
import type { Program, ProgramLifecycleStatus, ProgramCategory } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgramStatusManager } from '@/features/program/hooks/use-program-status-manager'
import { useQueryParams } from '@/shared/hooks/use-query-params'
// import { filterProgramsByACL } from '@/shared/utils/program-acl' // 개발 환경에서는 ACL 필터링 비활성화

interface ProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  category?: ProgramCategory | 'all'
  status?: ProgramLifecycleStatus
  progressStatus?: string
}

export function ProgramListPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const { user } = authStore
  const location = useLocation()
  const { params, setParam } = useQueryParams<ProgramListQueryParams>()
  const {
    programs,
    loading,
    fetchPrograms,
    deleteProgram,
    updateProgram,
    createProgram,
    selectedProgram,
    setSelectedProgram,
  } = useProgramStore()
  const { changeStatus: changeProgramStatus } = useProgramStatusManager()
  
  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerProgram,
    setSelectedItem: setDrawerProgram,
  } = useModalState<Program>()

  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingProgram,
    isEditing: isEditingMode,
  } = useModalState<Program>()

  // Delete 모달 상태 관리
  const {
    open: deleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
    selectedItem: programToDelete,
  } = useModalState<Program>()

  const [formLoading, setFormLoading] = useState(false)

  // 관리자만 프로그램 등록 가능
  const isAdmin = user?.role === 'ADMIN'
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  // MASTER, ADMIN은 쓰기 작업 가능
  const canWrite = canPerformWriteAction(user)

  // 디버깅용 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && isAdmin) {
    console.log('[ProgramListPage] 권한 체크:', {
      role: user?.role,
      adminLevel: user?.adminLevel,
      isAdmin,
      canWrite,
    })
  }
  // 강사용
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'

  // 카테고리명 가져오기
  const categoryName = isAdmin
    ? '프로그램 관리'
    : getCategoryNameByPath(location.pathname, 1) || '진행 프로그램'

  // 탭 필터 (강사용)
  const categoryTab = (params.category as ProgramCategory | 'all') || 'all'

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  // Phase 0.2.1: 로그인 후 redirect 파라미터로 프로그램 상세 열기
  useEffect(() => {
    const programId = params.programId
    if (programId && user && authStore.isAuthenticated) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setSelectedProgram(program)
        setDrawerProgram(program)
        openDrawer(program)
        // URL에서 programId 제거
        setParam('programId', null)
      }
    }
  }, [params.programId, user, authStore.isAuthenticated, programs, setParam])

  // status 쿼리 파라미터 읽기
  // ProgramProgressSummary 상태를 ProgramLifecycleStatus로 매핑하는 로직
  const getLifecycleStatusesForProgressStatus = (
    progressStatus: string
  ): ProgramLifecycleStatus[] => {
    const statusMap: Record<string, ProgramLifecycleStatus[]> = {
      RECEIVED: ['recruiting_students', 'recruiting_instructors', 'recruitment_completed_waiting'],
      MATCHING_IN_PROGRESS: ['matching_completed_waiting'],
      MATCHING_COMPLETED: ['matching_completed_waiting'],
      MATERIAL_PREPARING: ['matching_completed_waiting'],
      MATERIAL_SHIPPED: ['matching_completed_waiting'],
      IN_PROGRESS: ['in_progress'],
      SURVEY_SUBMITTED: ['completed'],
      REPORT_SUBMITTED: ['completed'],
    }
    return statusMap[progressStatus] || []
  }

  const statusFilter = useMemo<ProgramLifecycleStatus | null>(() => {
    const value = params.status as ProgramLifecycleStatus | null
    const validStatuses: ProgramLifecycleStatus[] = [
      'planned',
      'recruiting_students',
      'recruiting_instructors',
      'recruitment_completed_waiting',
      'matching_completed_waiting',
      'in_progress',
      'completed',
    ]
    return value && validStatuses.includes(value) ? value : null
  }, [params.status])

  // progressStatus 쿼리 파라미터 읽기 (대시보드에서 클릭한 경우)
  const progressStatusFilter = useMemo<string | null>(() => {
    return params.progressStatus || null
  }, [params.progressStatus])

  // 강사용: 신청 가능한 프로그램 및 수강자 모집 완료 프로그램 필터링 + 카테고리 필터
  // Phase 0.5.2: 프로그램 단위 ACL 필터링 추가
  const filteredPrograms = useMemo(() => {
    let filtered = programs

    // 개발/테스트 환경: 모든 관리자가 모든 프로그램을 볼 수 있도록 ACL 필터링 비활성화
    // 프로덕션 환경에서는 아래 주석을 해제하여 ACL 필터링 활성화
    // Phase 0.5.2: 관리자용 ACL 필터링 (일반 관리자는 OWNER 프로그램만 표시)
    // if (isAdmin && user?.adminLevel !== 'MASTER') {
    //   filtered = filterProgramsByACL(filtered, user, 'VIEW')
    // }

    // status 쿼리 파라미터 필터링 (관리자 및 참여자 모두)
    if (statusFilter) {
      filtered = filtered.filter(program => program.lifecycleStatus === statusFilter)
    }

    // progressStatus 쿼리 파라미터 필터링 (대시보드에서 클릭한 경우)
    // 여러 lifecycleStatus를 포함하도록 필터링
    if (progressStatusFilter) {
      const lifecycleStatuses = getLifecycleStatusesForProgressStatus(progressStatusFilter)
      if (lifecycleStatuses.length > 0) {
        filtered = filtered.filter(
          program => program.lifecycleStatus && lifecycleStatuses.includes(program.lifecycleStatus)
        )
      }
    }

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
        return program.lifecycleStatus && availableStatuses.includes(program.lifecycleStatus)
      })
    }

    // 카테고리 필터 (강사용)
    if (isUserRole && categoryTab !== 'all') {
      filtered = filtered.filter(program => program.category === categoryTab)
    }

    return filtered
  }, [programs, isUserRole, isAdmin, categoryTab, user, statusFilter, progressStatusFilter])

  // Phase 0.2.1: 비로그인 사용자 로그인 유도
  const handleView = (program: Program) => {
    // 비로그인 사용자는 로그인 페이지로 리다이렉트 (redirect 파라미터 포함)
    if (!user || !authStore.isAuthenticated) {
      const redirectPath = `/programs?programId=${program.id}`
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    // store에 동기화하고 Drawer 열기 (즉시 표시를 위해 drawerProgram도 설정)
    setSelectedProgram(program)
    setDrawerProgram(program)
    openDrawer(program)
  }

  const handleEdit = (program: Program) => {
    openFormModal(program)
    closeDrawer()
  }

  const handleNewClick = () => {
    openFormModal()
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
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createProgram(programData as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchPrograms()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingProgram ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'ProgramFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
  }

  const handleDeleteClick = (program: Program) => {
    openDeleteModal(program)
  }

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return

    try {
      await deleteProgram(programToDelete.id)
      showSuccessMessage(MESSAGES.success.deleted)
      closeDeleteModal()
      if (selectedProgram?.id === programToDelete.id) {
        closeDrawer()
        setDrawerProgram(null)
        setSelectedProgram(null)
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ProgramDelete',
      })
    }
  }

  const handleStatusChange = async (program: Program, status: ProgramLifecycleStatus) => {
    await changeProgramStatus(program.id, status)
  }

  const handleCategoryTabChange = (category: ProgramCategory | 'all') => {
    if (category === 'all') {
      setParam('category', null)
    } else {
      setParam('category', category)
    }
  }

  return (
    <div>
      <Space className="program-list-header">
        <h1 className="program-list-title">{categoryName}</h1>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewClick}
          allowedRoles={['ADMIN']}
          isWriteAction={true}
        >
          프로그램 등록
        </PermissionButton>
      </Space>

      {/* 강사용: 개인/단체 탭 */}
      {isUserRole && !isAdmin && (
        <Tabs
          activeKey={categoryTab}
          onChange={key => handleCategoryTabChange(key as ProgramCategory | 'all')}
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
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? handleDeleteClick : undefined}
        showActions={isAdmin && canWrite} // Phase 0.5.2: 쓰기 권한이 있는 관리자만 작업 컬럼 표시 (MASTER, ADMIN 허용)
        showFavorite={false} // 찜하기는 상세 패널에서만 제공
        onChangeStatus={canWrite ? handleStatusChange : undefined}
      />

      <ProgramDetailDrawer
        open={drawerOpen}
        program={drawerProgram || selectedProgram || undefined}
        onClose={() => {
          closeDrawer()
          setDrawerProgram(null)
          setSelectedProgram(null)
        }}
        onEdit={() => {
          if (selectedProgram) {
            closeDrawer()
            handleEdit(selectedProgram)
          }
        }}
        onDelete={() => {
          if (selectedProgram) {
            closeDrawer()
            handleDeleteClick(selectedProgram)
          }
        }}
        loading={loading}
        hideActions={!isAdmin} // 관리자가 아니면 수정/삭제 버튼 숨김
      />

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '프로그램 수정' : '프로그램 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.xlarge}
        destroyOnHidden
        zIndex={1001}
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
        onCancel={closeDeleteModal}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

// default export 추가 (lazy loading 호환성)
export default ProgramListPage
