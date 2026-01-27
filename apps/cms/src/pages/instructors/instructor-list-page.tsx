/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 * Phase 4.2.3: 권한별 UI 컴포넌트 적용
 * Phase 2: 리팩토링 패턴 적용
 * 강사 등록을 모달로 변경
 */

import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Space, Modal, Drawer } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { PermissionButton } from '@/shared/components'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import type { InstructorFormData } from '@/entities/instructor/model/schema'
import type { Instructor } from '@/types/domain'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface InstructorListQueryParams extends Record<string, string | undefined> {
  search?: string
  region?: string
}

export function InstructorListPage() {
  const {
    instructors,
    loading,
    fetchInstructors,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    selectedInstructor,
    setSelectedInstructor,
  } = useInstructorStore()
  const { params, setParams } = useQueryParams<InstructorListQueryParams>()

  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingInstructor,
    isEditing: isEditingMode,
  } = useModalState<{ id: string; data: InstructorFormData }>()

  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerInstructor,
  } = useModalState<Instructor>()

  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  // 지역 옵션 생성
  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(instructors.map(i => i.region))).sort()
    return [
      { label: '전체', value: 'all' },
      ...regions.map(region => ({ label: region, value: region })),
    ]
  }, [instructors])

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    search: params.search || '',
    region: params.region || 'all',
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 초기화
  useEffect(() => {
    setPendingFilters({
      search: params.search || '',
      region: params.region || 'all',
    })
  }, [params.search, params.region])

  // 필터링된 데이터
  const filteredInstructors = useMemo(() => {
    let filtered = instructors

    // 검색어 필터
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filtered = filtered.filter(
        instructor =>
          instructor.name.toLowerCase().includes(searchLower) ||
          instructor.contactEmail?.toLowerCase().includes(searchLower) ||
          instructor.specialty?.some(s => s.toLowerCase().includes(searchLower))
      )
    }

    // 지역 필터
    if (params.region && params.region !== 'all') {
      filtered = filtered.filter(instructor => instructor.region === params.region)
    }

    return filtered
  }, [instructors, params.search, params.region])

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    setParams({
      search: pendingFilters.search || undefined,
      region: pendingFilters.region === 'all' ? undefined : pendingFilters.region,
    })
  }

  // 필터 초기화
  const handleFilterReset = () => {
    setPendingFilters({
      search: '',
      region: 'all',
    })
    setParams({
      search: undefined,
      region: undefined,
    })
  }

  const handleNewClick = () => {
    openFormModal()
  }

  const handleFormSubmit = async (data: InstructorFormData) => {
    setFormLoading(true)
    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.id, data)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createInstructor(data)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingInstructor ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'InstructorFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
  }

  const handleView = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    openDrawer(instructor)
  }

  const handleEdit = (instructor: Instructor) => {
    openFormModal({ id: instructor.id, data: {} as InstructorFormData })
    closeDrawer()
  }

  const handleDelete = async (instructor: Instructor) => {
    setDeleteLoading(true)
    try {
      await deleteInstructor(instructor.id)
      showSuccessMessage(MESSAGES.success.deleted)
      if (selectedInstructor?.id === instructor.id) {
        closeDrawer()
        setSelectedInstructor(null)
      }
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'InstructorDelete',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // prop의 instructor를 우선 사용 (즉시 표시), 없으면 store의 selectedInstructor 사용
  const displayInstructor = drawerInstructor || selectedInstructor || null

  return (
    <div>
      <div
        style={{
          marginBottom: LAYOUT_CONSTANTS.margins.lg,
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewClick}
          allowedRoles={['ADMIN']}
          isWriteAction={true}
        >
          강사 등록
        </PermissionButton>
      </div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '이름/이메일/전문분야',
            placeholder: '이름, 이메일, 전문분야를 입력하세요',
          },
          {
            key: 'region',
            type: 'select',
            label: '지역',
            placeholder: '전체',
            options: regionOptions,
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        onReset={handleFilterReset}
      />

      <InstructorList data={filteredInstructors} loading={loading} onView={handleView} />

      <Drawer
        title="강사 상세"
        placement="right"
        width={LAYOUT_CONSTANTS.widths.modal.large}
        open={drawerOpen}
        onClose={() => {
          closeDrawer()
          setSelectedInstructor(null)
        }}
      >
        {displayInstructor && (
          <InstructorDetail
            instructor={displayInstructor}
            onEdit={() => handleEdit(displayInstructor)}
            onDelete={() => handleDelete(displayInstructor)}
            loading={deleteLoading}
          />
        )}
      </Drawer>

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '강사 수정' : '강사 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        destroyOnHidden
      >
        <InstructorForm
          instructor={
            editingInstructor ? instructors.find(i => i.id === editingInstructor.id) : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}
