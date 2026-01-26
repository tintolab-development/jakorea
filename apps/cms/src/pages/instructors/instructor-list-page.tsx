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
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import type { InstructorFormData } from '@/entities/instructor/model/schema'
import type { Instructor } from '@/types/domain'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface InstructorListQueryParams extends Record<string, string | undefined> {
  search?: string
  region?: string
}

export function InstructorListPage() {
  const location = useLocation()
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

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'

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

  // 필터 핸들러
  const handleFilterChange = (key: keyof InstructorListQueryParams, value: any) => {
    setParams({
      [key]: value === 'all' || value === '' ? undefined : value,
    })
  }

  const handleFilterReset = () => {
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
      <Space style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewClick}
          allowedRoles={['ADMIN']}
          isWriteAction={true}
        >
          강사 등록
        </PermissionButton>
      </Space>
      <ListPageFilters
        filters={{
          region: params.region || 'all',
        }}
        onFilterChange={handleFilterChange}
        searchValue={params.search || ''}
        onSearchChange={(value) => setParams({ search: value || undefined })}
        searchPlaceholder="이름, 이메일, 전문분야 검색"
        filterConfig={[
          {
            key: 'region',
            type: 'select',
            options: regionOptions,
            placeholder: '지역 선택',
          },
        ]}
        onReset={handleFilterReset}
        showReset={!!(params.search || params.region)}
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
