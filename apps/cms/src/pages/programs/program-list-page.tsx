/**
 * 프로그램 목록 페이지
 * Phase 2.1: 목록 페이지 (기획자 요청: 사이드 패널 활용)
 * 프로그램 등록을 모달로 변경
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Modal, Tabs } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/ui/page-header'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { AppButton } from '@/shared/ui/app-button'
import { ProgramList } from '@/features/program/ui/program-list'
import { useSearchParams } from 'react-router-dom'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramForm } from '@/features/program/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
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
import { EnrollmentStatusDetailModal } from '@/features/program/ui/enrollment-status-detail-modal'
import { InstructorRecruitmentDetailModal } from '@/features/program/ui/instructor-recruitment-detail-modal'
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
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)

  // 수강자 모집 페이지: 테이블 행 클릭 시 수강 신청 학교 목록 상세 모달
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<Program | null>(null)
  const [selectedProgramForInstructorModal, setSelectedProgramForInstructorModal] =
    useState<Program | null>(null)

  const [formLoading, setFormLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 테이블 표시 건수·필터 적용 여부 (필터 없을 땐 전체 건수 표시 → 상단 위젯과 일치)
  const [displayCount, setDisplayCount] = useState<number | null>(null)
  const [hasListFilters, setHasListFilters] = useState(false)

  // 뷰 모드를 쿼리 파라미터로 관리
  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  // URL에서 뷰 모드 읽어오기 (초기화 및 뒤로가기 대응)
  useEffect(() => {
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  // 수강자/강사 모집 경로에서는 항상 리스트(테이블) 뷰 적용 — 위젯 클릭 시 테이블이 보이도록
  useEffect(() => {
    const isRecruitmentRoute =
      location.pathname === '/programs/education/student-recruitment' ||
      location.pathname === '/programs/education/instructor-recruitment'
    if (isRecruitmentRoute && viewMode !== 'list') {
      setViewMode('list')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('viewMode', 'list')
      setSearchParams(nextParams, { replace: true })
    }
  }, [location.pathname])

  // 검색 인풋 로컬 상태 (한글 IME 조합 문제 해결)
  const [searchInputValue, setSearchInputValue] = useState(() => searchParams.get('title') || '')
  const isInternalUpdate = useRef(false)

  // 로컬 상태 -> URL 파라미터 동기화 (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlTitle = searchParams.get('title') || ''
      const trimmedValue = searchInputValue.trim()

      if (trimmedValue !== currentUrlTitle) {
        isInternalUpdate.current = true
        const nextParams = new URLSearchParams(searchParams)
        if (trimmedValue) {
          nextParams.set('title', trimmedValue)
        } else {
          nextParams.delete('title')
        }
        setSearchParams(nextParams, { replace: true })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInputValue])

  // URL 파라미터 -> 로컬 상태 동기화 (외부 변경만, 예: 뒤로가기)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    const urlTitle = searchParams.get('title') || ''
    setSearchInputValue(urlTitle)
  }, [searchParams])

  // 관리자만 프로그램 등록 가능
  const isAdmin = user?.role === 'ADMIN'
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  // MASTER, ADMIN은 쓰기 작업 가능
  const canWrite = canPerformWriteAction(user)

  // 강사용
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'

  // 프로그램 타입 구분 (교육/봉사). 교육 프로그램 레이아웃 하위 경로 포함
  const programType = useMemo<'education' | 'volunteer' | 'all'>(() => {
    if (
      location.pathname === '/programs/education' ||
      location.pathname.startsWith('/programs/education/')
    )
      return 'education'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  // 탭 필터 (강사용)
  const categoryTab = (params.category as ProgramCategory | 'all') || 'all'

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  // Phase 0.2.1: 로그인 후 redirect 파라미터로 프로그램 상세 페이지로 이동
  useEffect(() => {
    const programId = params.programId
    if (programId && user && authStore.isAuthenticated) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setParam('programId', null)
        navigate(`/programs/${programId}`)
      }
    }
  }, [params.programId, user, authStore.isAuthenticated, programs, setParam, navigate])

  // 진행현황 단일 소스: URL params.status(위젯 클릭·필터 카드 조회 모두 동일 URL 반영). 없으면 경로 기본값
  const isStudentRecruitmentRoute = location.pathname === '/programs/education/student-recruitment'
  const isInstructorRecruitmentRoute =
    location.pathname === '/programs/education/instructor-recruitment'
  const statusFilter = useMemo<ProgramLifecycleStatus | null>(() => {
    const value = params.status as ProgramLifecycleStatus | null
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    if (value && (value === 'education_before_textbook' || validStatuses.has(value))) {
      return value === 'education_before_textbook' ? 'matching_completed' : value
    }
    if (isStudentRecruitmentRoute) return 'recruiting_students'
    if (isInstructorRecruitmentRoute) return 'recruiting_instructors'
    return null
  }, [params.status, isStudentRecruitmentRoute, isInstructorRecruitmentRoute])

  // 강사용: 신청 가능한 프로그램 및 수강자 모집 완료 프로그램 필터링 + 카테고리 필터
  // Phase 0.5.2: 프로그램 단위 ACL 필터링 추가
  // 교육 탭에서는 상단 요약(ProgramProgressWidget)과 동일한 소스(getEducationPrograms) 사용 → 건수 일치
  const filteredPrograms = useMemo(() => {
    let filtered: Program[]

    if (isAdmin && programType === 'education') {
      // 교육 프로그램: 상단 요약과 동일한 목록 사용 (요약 건수와 테이블 "총 N건" 일치)
      filtered = getEducationPrograms()
    } else {
      filtered = programs
    }

    // 개발/테스트 환경: 모든 관리자가 모든 프로그램을 볼 수 있도록 ACL 필터링 비활성화
    // 프로덕션 환경에서는 아래 주석을 해제하여 ACL 필터링 활성화
    // Phase 0.5.2: 관리자용 ACL 필터링 (일반 관리자는 OWNER 프로그램만 표시)
    // if (isAdmin && user?.adminLevel !== 'MASTER') {
    //   filtered = filterProgramsByACL(filtered, user, 'VIEW')
    // }

    // 관리자용: 봉사 프로그램 필터링 (교육은 위에서 이미 getEducationPrograms 사용)
    if (isAdmin && programType === 'volunteer') {
      const volunteerPrograms = getVolunteerPrograms()
      const volunteerProgramIds = new Set(volunteerPrograms.map(p => p.id))
      filtered = filtered.filter(program => volunteerProgramIds.has(program.id))
    }

    // status 쿼리 파라미터 필터링 (6단계: 교재 준비 중 = matching+before, 교육 진행 중 = before+after)
    if (statusFilter) {
      if (statusFilter === 'matching_completed') {
        filtered = filtered.filter(
          program =>
            program.lifecycleStatus === 'matching_completed' ||
            program.lifecycleStatus === 'education_before_textbook'
        )
      } else if (statusFilter === 'education_after_textbook') {
        filtered = filtered.filter(
          program => program.lifecycleStatus === 'education_after_textbook'
        )
      } else {
        filtered = filtered.filter(program => program.lifecycleStatus === statusFilter)
      }
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

  // 테이블 행 클릭 시 해당 프로그램 상세 페이지로 라우팅 (수강자 모집 경로는 모달만 오픈)
  const handleView = (program: Program) => {
    // 비로그인 사용자는 로그인 페이지로 리다이렉트 (redirect 파라미터 포함)
    if (!user || !authStore.isAuthenticated) {
      const redirectPath = `/programs/${program.id}`
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    // 수강자 모집 페이지: 행 클릭 시 수강 신청 학교 목록 상세 모달만 오픈
    if (location.pathname === '/programs/education/student-recruitment') {
      setSelectedProgramForModal(program)
      return
    }

    // 강사 모집 페이지: 행 클릭 시 강의 신청 강사 목록 상세 모달만 오픈
    if (location.pathname === '/programs/education/instructor-recruitment') {
      setSelectedProgramForInstructorModal(program)
      return
    }

    // 프로그램 상세 페이지로 이동
    navigate(`/programs/${program.id}`)
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
    // 삭제 확인 모달 표시
    setProgramToDelete(program)
    setDeleteModalOpen(true)
  }

  // 삭제 확인 메시지 생성
  const getDeleteConfirmMessage = (program: Program | null): string => {
    if (!program) return '정말 이 프로그램을 삭제하시겠습니까?'

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
    return hasRelatedData
      ? `이 프로그램과 연결된 ${warnings.join(', ')}이(가) 있습니다. 삭제하면 관련 데이터도 함께 삭제됩니다. 정말 삭제하시겠습니까?`
      : '정말 이 프로그램을 삭제하시겠습니까?'
  }

  const handleConfirmDelete = async () => {
    if (!programToDelete) return

    try {
      // 삭제 전 관련 데이터 확인
      const relatedData = checkProgramRelatedData(programToDelete.id)

      // 관련 데이터 삭제 (Cascade Delete)
      if (relatedData.hasApplications) {
        // 신청서 삭제는 실제로는 서비스 레이어에서 처리되어야 하지만,
        // Mock 데이터이므로 여기서 직접 처리
        const relatedAppIds = mockApplications
          .filter(app => app.programId === programToDelete.id)
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
          .filter(m => m.programId === programToDelete.id)
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
          .filter(s => s.programId === programToDelete.id)
          .map(s => s.id)
        relatedScheduleIds.forEach(scheduleId => {
          const index = mockSchedules.findIndex(s => s.id === scheduleId)
          if (index !== -1) {
            mockSchedules.splice(index, 1)
          }
        })
      }

      // 프로그램 삭제
      await deleteProgram(programToDelete.id)
      showSuccessMessage(MESSAGES.success.deleted)
      // 선택된 행 키에서 삭제된 프로그램 제거
      setSelectedRowKeys(prev => prev.filter(key => key !== programToDelete.id))
      // 삭제된 프로그램이 상세 Drawer에 열려있으면 닫기
      const currentDrawerProgram = drawerProgram || selectedProgram
      if (currentDrawerProgram?.id === programToDelete.id) {
        closeDrawer()
        setDrawerProgram(null)
        setSelectedProgram(null)
      }
      // 프로그램 목록 새로고침 (Drawer 닫은 후에 실행)
      await fetchPrograms()
      // 모달 닫기
      setDeleteModalOpen(false)
      setProgramToDelete(null)
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ProgramDelete',
      })
    }
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setProgramToDelete(null)
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
      {/* 관리자용: 프로그램 진행 현황 위젯 — 교육 프로그램 레이아웃 하위에서는 레이아웃에서 렌더하므로 중복 미표시 */}
      {isAdmin && programType === 'education' && !location.pathname.startsWith('/programs/education') && (
        <div className="program-progress-widget-container">
          <ProgramProgressWidget title={null} />
        </div>
      )}

      {/* 관리자용: 프로그램 진행 현황 (탭+테이블) — 전체 현황 */}
      {isAdmin && programType === 'all' && (
        <div className="program-list-widget-container">
          <ProgramProgressTabsTable />
        </div>
      )}

      {/* 위젯 디바이더 아래 버튼 영역 (교육 프로그램만, 진행현황 필터에 따라 제목·컬럼·액션 통일) */}
      {isAdmin && programType === 'education' && (
        <PageHeader
          title={
            statusFilter === 'recruiting_instructors'
              ? '강사 모집 중인 프로그램'
              : statusFilter === 'recruiting_students'
                ? '수강자 모집 중인 프로그램'
                : '전체 프로그램'
          }
          description={`총 ${hasListFilters && displayCount !== null ? displayCount : filteredPrograms.length}건`}
          actions={
            statusFilter === null ? (
              <div className="program-list-page__widget-header-actions">
                {viewMode === 'list' && (
                  <LabeledSearchInput
                    label="검색"
                    placeholder="검색어를 입력하세요"
                    value={searchInputValue}
                    onChange={setSearchInputValue}
                    allowClear
                    width={300}
                    showLabel={false}
                  />
                )}
                <AppButton
                  variant="cancel"
                  size="filter"
                  icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
                  onClick={() => {
                    const newViewMode = viewMode === 'list' ? 'calendar' : 'list'
                    setViewMode(newViewMode)
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.set('viewMode', newViewMode)
                    setSearchParams(nextParams, { replace: true })
                  }}
                  className="program-view-mode-button"
                >
                  {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
                </AppButton>
                {showEducationActions && (
                  <AppButton variant="primary" size="filter" onClick={handleNewClick}>
                    프로그램 신규 등록
                  </AppButton>
                )}
              </div>
            ) : undefined
          }
        />
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
        viewMode={viewMode}
        onViewModeChange={mode => {
          setViewMode(mode)
          // URL 쿼리 파라미터 업데이트
          const nextParams = new URLSearchParams(searchParams)
          nextParams.set('viewMode', mode)
          setSearchParams(nextParams, { replace: true })
        }}
        tableVariant={programType}
        studentRecruitmentTable={statusFilter === 'recruiting_students'}
        instructorRecruitmentTable={statusFilter === 'recruiting_instructors'}
        onDisplayCountChange={(count, hasActiveFilters) => {
          setDisplayCount(count)
          setHasListFilters(hasActiveFilters)
        }}
        effectiveLifecycleStatus={statusFilter}
      />

      <EnrollmentStatusDetailModal
        open={!!selectedProgramForModal}
        program={selectedProgramForModal}
        onCancel={() => setSelectedProgramForModal(null)}
      />
      <InstructorRecruitmentDetailModal
        open={!!selectedProgramForInstructorModal}
        program={selectedProgramForInstructorModal}
        onCancel={() => setSelectedProgramForInstructorModal(null)}
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
          // store의 selectedProgram을 우선 사용, 없으면 drawerProgram 또는 selectedProgram 사용
          const storeSelectedProgram = useProgramStore.getState().selectedProgram
          const programToDelete = storeSelectedProgram || drawerProgram || selectedProgram

          if (programToDelete) {
            // programToDelete가 객체인지 확인
            if (programToDelete && typeof programToDelete === 'object' && 'id' in programToDelete) {
              // handleDeleteClick 내부에서 Drawer를 닫으므로 여기서는 닫지 않음
              handleDeleteClick(programToDelete)
            } else {
              console.error(
                '[ProgramListPage] programToDelete가 유효한 Program 객체가 아닙니다:',
                programToDelete
              )
            }
          } else {
            console.warn('삭제할 프로그램을 찾을 수 없습니다.', {
              storeSelectedProgram,
              drawerProgram,
              selectedProgram,
            })
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
        destroyOnClose
        zIndex={1001}
      >
        <ProgramForm
          key={editingProgram?.id || 'new'}
          program={editingProgram || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={deleteModalOpen}
        title="프로그램 삭제"
        content={getDeleteConfirmMessage(programToDelete)}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="삭제"
        cancelText="취소"
        danger
      />
    </div>
  )
}

// default export 추가 (lazy loading 호환성)
export default ProgramListPage
