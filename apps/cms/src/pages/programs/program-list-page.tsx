/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 * 프로그램 등록을 모달로 변경
 */

import { useState, useEffect, useMemo } from 'react'
import { Modal, Tabs } from 'antd'
import { ProgramList } from '@/features/program/ui/program-list'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramForm } from '@/features/program/ui/program-form'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import './program-list-page.css'
import type { Program, ProgramLifecycleStatus, ProgramCategory } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgramStatusManager } from '@/features/program/hooks/use-program-status-manager'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { programLifecycleStatusConfig } from '@/shared/constants/status'
import {
  getVolunteerPrograms,
  getEducationPrograms,
  mockApplications,
  mockMatchings,
  mockSchedules,
} from '@/data/mock'
import { ProgramProgressWidget } from '@/features/dashboard/ui/program-progress-widget'
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
// import { filterProgramsByACL } from '@/shared/utils/program-acl' // 개발 환경에서는 ACL 필터링 비활성화

interface ProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  category?: ProgramCategory | 'all'
  status?: ProgramLifecycleStatus
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

  // Delete 모달은 handleDeleteClick에서 직접 Modal.confirm 사용

  const [formLoading, setFormLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

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

  // 프로그램 타입 구분 (교육/봉사)
  const programType = useMemo<'education' | 'volunteer' | 'all'>(() => {
    if (location.pathname === '/programs/education') return 'education'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

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

  const statusFilter = useMemo<ProgramLifecycleStatus | null>(() => {
    const value = params.status as ProgramLifecycleStatus | null
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    return value && validStatuses.has(value) ? value : null
  }, [params.status])

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

    // 관리자용: 교육 프로그램 / 봉사 프로그램 필터링
    if (isAdmin && programType !== 'all') {
      if (programType === 'volunteer') {
        // 봉사 프로그램만 표시
        const volunteerPrograms = getVolunteerPrograms()
        const volunteerProgramIds = new Set(volunteerPrograms.map(p => p.id))
        filtered = filtered.filter(program => volunteerProgramIds.has(program.id))
      } else if (programType === 'education') {
        // 교육 프로그램만 표시 (getEducationPrograms 결과를 직접 사용)
        const educationPrograms = getEducationPrograms()
        const educationProgramIds = new Set(educationPrograms.map(p => p.id))
        // store의 programs와 매칭하되, 추가 생성된 프로그램도 포함
        filtered = filtered.filter(program => educationProgramIds.has(program.id))
        // store에 없는 추가 생성된 프로그램도 포함
        const missingPrograms = educationPrograms.filter(ep => !filtered.some(p => p.id === ep.id))
        filtered = [...filtered, ...missingPrograms]
      }
    }

    // status 쿼리 파라미터 필터링 (대시보드 7단계·프로그램 관리와 동일)
    if (statusFilter) {
      filtered = filtered.filter(program => program.lifecycleStatus === statusFilter)
    }

    // 강사용일 경우 신청 가능한 프로그램 및 진행 단계 프로그램 표시 (7단계)
    if (isUserRole && !isAdmin) {
      filtered = filtered.filter(program => {
        const status = program.lifecycleStatus
        if (!status) return false
        const available: ProgramLifecycleStatus[] = [
          'recruiting_students',
          'recruiting_instructors',
          'matching_completed',
          'education_before_textbook',
          'education_after_textbook',
          'education_completed',
          'document_processing_completed',
        ]
        return available.includes(status)
      })
    }

    // 카테고리 필터 (강사용)
    if (isUserRole && categoryTab !== 'all') {
      filtered = filtered.filter(program => program.category === categoryTab)
    }

    return filtered
  }, [programs, isUserRole, isAdmin, categoryTab, user, statusFilter, programType])

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

  // 프로그램 삭제 전 관련 데이터 확인
  const checkProgramRelatedData = (programId: string) => {
    const relatedApplications = mockApplications.filter(app => app.programId === programId)
    const relatedMatchings = mockMatchings.filter(m => m.programId === programId)
    const relatedSchedules = mockSchedules.filter(s => s.programId === programId)

    return {
      hasApplications: relatedApplications.length > 0,
      hasMatchings: relatedMatchings.length > 0,
      hasSchedules: relatedSchedules.length > 0,
      applicationCount: relatedApplications.length,
      matchingCount: relatedMatchings.length,
      scheduleCount: relatedSchedules.length,
    }
  }

  const handleDeleteClick = (program: Program) => {
    // 삭제 전 관련 데이터 확인
    const relatedData = checkProgramRelatedData(program.id)

    // 관련 데이터가 있는 경우 경고 메시지 구성
    const warnings: string[] = []
    if (relatedData.hasApplications) {
      warnings.push(`신청서 ${relatedData.applicationCount}건`)
    }
    if (relatedData.hasMatchings) {
      warnings.push(`매칭 ${relatedData.matchingCount}건`)
    }
    if (relatedData.hasSchedules) {
      warnings.push(`일정 ${relatedData.scheduleCount}건`)
    }

    const hasRelatedData = warnings.length > 0
    const warningMessage = hasRelatedData
      ? `이 프로그램과 연결된 ${warnings.join(', ')}이(가) 있습니다. 삭제하면 관련 데이터도 함께 삭제됩니다. 정말 삭제하시겠습니까?`
      : '정말 이 프로그램을 삭제하시겠습니까?'

    // 확인 모달 표시
    Modal.confirm({
      title: '프로그램 삭제',
      content: warningMessage,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          // 관련 데이터 삭제 (Cascade Delete)
          if (relatedData.hasApplications) {
            // 신청서 삭제는 실제로는 서비스 레이어에서 처리되어야 하지만,
            // Mock 데이터이므로 여기서 직접 처리
            const relatedAppIds = mockApplications
              .filter(app => app.programId === program.id)
              .map(app => app.id)
            relatedAppIds.forEach(appId => {
              const index = mockApplications.findIndex(a => a.id === appId)
              if (index !== -1) {
                mockApplications.splice(index, 1)
              }
            })
          }

          if (relatedData.hasMatchings) {
            // 매칭 삭제
            const relatedMatchingIds = mockMatchings
              .filter(m => m.programId === program.id)
              .map(m => m.id)
            relatedMatchingIds.forEach(matchingId => {
              const index = mockMatchings.findIndex(m => m.id === matchingId)
              if (index !== -1) {
                mockMatchings.splice(index, 1)
              }
            })
          }

          if (relatedData.hasSchedules) {
            // 일정 삭제
            const relatedScheduleIds = mockSchedules
              .filter(s => s.programId === program.id)
              .map(s => s.id)
            relatedScheduleIds.forEach(scheduleId => {
              const index = mockSchedules.findIndex(s => s.id === scheduleId)
              if (index !== -1) {
                mockSchedules.splice(index, 1)
              }
            })
          }

          // 프로그램 삭제
          await deleteProgram(program.id)
          showSuccessMessage(MESSAGES.success.deleted)
          // 선택된 행 키에서 삭제된 프로그램 제거
          setSelectedRowKeys(prev => prev.filter(key => key !== program.id))
          // 프로그램 목록 새로고침
          await fetchPrograms()
          // 삭제된 프로그램이 상세 Drawer에 열려있으면 닫기
          if (selectedProgram?.id === program.id) {
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
      },
    })
  }

  const handleBulkDelete = async (programs: Program[]) => {
    if (programs.length === 0) return
    const ids = new Set(programs.map(p => p.id))

    try {
      // 각 프로그램의 관련 데이터 확인 및 삭제
      for (const program of programs) {
        const relatedData = checkProgramRelatedData(program.id)

        // 관련 데이터 삭제 (Cascade Delete)
        if (relatedData.hasApplications) {
          const relatedAppIds = mockApplications
            .filter(app => app.programId === program.id)
            .map(app => app.id)
          relatedAppIds.forEach(appId => {
            const index = mockApplications.findIndex(a => a.id === appId)
            if (index !== -1) {
              mockApplications.splice(index, 1)
            }
          })
        }

        if (relatedData.hasMatchings) {
          const relatedMatchingIds = mockMatchings
            .filter(m => m.programId === program.id)
            .map(m => m.id)
          relatedMatchingIds.forEach(matchingId => {
            const index = mockMatchings.findIndex(m => m.id === matchingId)
            if (index !== -1) {
              mockMatchings.splice(index, 1)
            }
          })
        }

        if (relatedData.hasSchedules) {
          const relatedScheduleIds = mockSchedules
            .filter(s => s.programId === program.id)
            .map(s => s.id)
          relatedScheduleIds.forEach(scheduleId => {
            const index = mockSchedules.findIndex(s => s.id === scheduleId)
            if (index !== -1) {
              mockSchedules.splice(index, 1)
            }
          })
        }

        // 프로그램 삭제
        await deleteProgram(program.id)
      }

      showSuccessMessage(`선택한 ${programs.length}건이 삭제되었습니다.`)
      // 선택된 행 키 초기화
      setSelectedRowKeys([])
      // 프로그램 목록 새로고침
      await fetchPrograms()
      // 삭제된 프로그램이 상세 Drawer에 열려있으면 닫기
      if (selectedProgram && ids.has(selectedProgram.id)) {
        closeDrawer()
        setDrawerProgram(null)
        setSelectedProgram(null)
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ProgramBulkDelete',
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

  const showEducationActions = Boolean(isAdmin && canWrite && programType === 'education')

  return (
    <div>
      {/* 관리자용: 프로그램 진행 현황 위젯 (교육 프로그램) */}
      {isAdmin && programType === 'education' && (
        <div className="program-progress-widget-container">
          <ProgramProgressWidget title={null} showDetailLink={false} />
        </div>
      )}

      {/* 관리자용: 프로그램 진행 현황 (탭+테이블) — 전체 현황 */}
      {isAdmin && programType === 'all' && (
        <div className="program-list-widget-container">
          <ProgramProgressTabsTable />
        </div>
      )}

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
        onEdit={showEducationActions ? handleEdit : undefined}
        onDelete={showEducationActions ? handleDeleteClick : undefined}
        onBulkDelete={showEducationActions ? handleBulkDelete : undefined}
        onSelectionChange={showEducationActions ? setSelectedRowKeys : undefined}
        selectedRowKeys={showEducationActions ? selectedRowKeys : undefined}
        showActions={showEducationActions}
        showRowSelection={showEducationActions}
        showFavorite={false}
        onChangeStatus={showEducationActions ? handleStatusChange : undefined}
        showCalendarView={isAdmin && programType === 'education'}
        onCreateNew={showEducationActions ? handleNewClick : undefined}
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
        hideActions={!showEducationActions}
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

      {/* 삭제 확인은 handleDeleteConfirm 내부의 Modal.confirm으로 처리 */}
    </div>
  )
}

// default export 추가 (lazy loading 호환성)
export default ProgramListPage
