/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 * Phase 4.2.3: 권한별 UI 컴포넌트 적용
 * Phase 2: 리팩토링 패턴 적용
 * 강사 등록을 모달로 변경
 */

import { useEffect, useState, useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { Modal, Drawer } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { PermissionButton } from '@/shared/components'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import type { InstructorFormData } from '@/entities/instructor/model/schema'
import type { Instructor } from '@/types/domain'
import { handleError } from '@/shared/utils/error-handler'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import { createInstructorListTablePageConfig } from './instructor-list-table.config'
import '@/pages/programs/program-list-page.css'

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
  const { params } = useQueryParams<InstructorListQueryParams>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingInstructor,
    isEditing: isEditingMode,
  } = useModalState<Instructor>()

  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerInstructor,
  } = useModalState<Instructor>()

  const [formLoading, setFormLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletingInstructor, setDeletingInstructor] = useState<
    Instructor | { id: string; instructorId?: string; name?: string } | null
  >(null)

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

  const filterFields = useMemo(
    () => [
      {
        key: 'search',
        type: 'search' as const,
        label: '이름/이메일/전문분야',
        placeholder: '이름, 이메일, 전문분야를 입력하세요',
      },
      {
        key: 'region',
        type: 'select' as const,
        label: '지역',
        placeholder: '전체',
        options: regionOptions,
      },
    ],
    [regionOptions]
  )

  // 필터링된 데이터
  const filteredInstructors = useMemo(() => {
    let filtered = instructors

    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filtered = filtered.filter(
        instructor =>
          instructor.name.toLowerCase().includes(searchLower) ||
          instructor.contactEmail?.toLowerCase().includes(searchLower) ||
          instructor.specialty?.some(s => s.toLowerCase().includes(searchLower))
      )
    }

    if (params.region && params.region !== 'all') {
      filtered = filtered.filter(instructor => instructor.region === params.region)
    }

    return filtered
  }, [instructors, params.search, params.region])

  const instructorListTablePageConfig = useMemo(() => createInstructorListTablePageConfig(), [])

  const { pendingFilters, handleFilterChange, applySearch } = useTablePage(
    instructorListTablePageConfig,
    {
      data: filteredInstructors,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const instructorExcelColumns = useMemo<
    ColumnsType<{
      name: string
      email: string
      phone: string
      pillar: string
      specialty: string
      status: string
      createdAt: string
    }>
  >(
    () => [
      { title: '이름', dataIndex: 'name', key: 'name' },
      { title: '이메일', dataIndex: 'email', key: 'email' },
      { title: '연락처', dataIndex: 'phone', key: 'phone' },
      { title: '강사단', dataIndex: 'pillar', key: 'pillar' },
      { title: '전문분야', dataIndex: 'specialty', key: 'specialty' },
      { title: '상태', dataIndex: 'status', key: 'status' },
      { title: '등록일', dataIndex: 'createdAt', key: 'createdAt' },
    ],
    []
  )

  const instructorExcelData = useMemo(
    () =>
      filteredInstructors.map(instructor => ({
        name: instructor.name,
        email: instructor.contactEmail ?? '',
        phone: instructor.contactPhone ?? '',
        pillar: instructor.instructorType ?? '',
        specialty: instructor.specialty?.join(', ') ?? '',
        status: 'ACTIVE',
        createdAt: String(instructor.createdAt ?? ''),
      })),
    [filteredInstructors]
  )

  const handleNewClick = () => {
    openFormModal()
  }

  const handleFormSubmit = async (data: InstructorFormData) => {
    setFormLoading(true)
    try {
      if (editingInstructor && editingInstructor.id) {
        await updateInstructor(editingInstructor.id, data)
        } else {
        await createInstructor(data)
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
    openFormModal(instructor)
    closeDrawer()
  }

  const handleDeleteClick = (
    instructor: Instructor | { id: string; instructorId?: string; name?: string }
  ) => {
    setDeletingInstructor(instructor)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingInstructor) return

    setDeleteLoading(true)
    try {
      const instructorId =
        'instructorId' in deletingInstructor && deletingInstructor.instructorId
          ? deletingInstructor.instructorId
          : deletingInstructor.id

      await deleteInstructor(instructorId)
      if (selectedInstructor?.id === instructorId) {
        closeDrawer()
        setSelectedInstructor(null)
      }
      setDeleteModalOpen(false)
      setDeletingInstructor(null)
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

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDeletingInstructor(null)
  }

  const displayInstructor = drawerInstructor || selectedInstructor || null

  return (
    <div>
      <FilterTableLayout
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={applySearch}
        loading={loading}
        title="강사 목록"
        description={`총 ${filteredInstructors.length.toLocaleString()}건`}
        actions={
          <PermissionButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewClick}
            allowedRoles={['ADMIN']}
            isWriteAction={true}
          >
            강사 등록
          </PermissionButton>
        }
        excelExport={{
          columns: instructorExcelColumns,
          data: instructorExcelData,
        }}
      >
        <div className="program-list-content-wrapper__table">
          <InstructorList data={filteredInstructors} loading={loading} onView={handleView} />
        </div>
      </FilterTableLayout>

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
            onDelete={() => handleDeleteClick(displayInstructor)}
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
        destroyOnClose
      >
        <InstructorForm
          key={editingInstructor?.id || 'new'}
          instructor={editingInstructor || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="강사 삭제 확인"
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmLoading={deleteLoading}
        okText="삭제"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        {deletingInstructor && (
          <>
            <p>정말로 다음 강사를 삭제하시겠습니까?</p>
            <p style={{ fontWeight: 'bold', margin: '16px 0' }}>
              {'name' in deletingInstructor && deletingInstructor.name
                ? deletingInstructor.name
                : '이 강사'}
            </p>
            <p style={{ color: '#ff4d4f', fontSize: '12px' }}>삭제된 강사는 복구할 수 없습니다.</p>
          </>
        )}
      </Modal>
    </div>
  )
}
