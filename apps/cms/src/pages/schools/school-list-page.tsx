/**
 * 학교 목록 페이지
 * Phase 1.4: 목록 페이지
 * Phase 2: 리팩토링 패턴 적용
 * 학교 등록을 모달로 변경
 */

import { useEffect, useState, useMemo } from 'react'
import { Button, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SchoolList } from '@/features/school/ui/school-list'
import { SchoolForm } from '@/features/school/ui/school-form'
import { useSchoolStore } from '@/features/school/model/school-store'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import type { SchoolFormData } from '@/entities/school/model/schema'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { School } from '@/types/domain'

interface SchoolListQueryParams extends Record<string, string | undefined> {
  search?: string
  region?: string
}

export function SchoolListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const { schools, loading, fetchSchools, createSchool, updateSchool, deleteSchool } =
    useSchoolStore()
  const { params, setParams } = useQueryParams<SchoolListQueryParams>()

  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingSchool,
    isEditing: isEditingMode,
  } = useModalState<School>()

  const [formLoading, setFormLoading] = useState(false)
  const [, setDeleteLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null)

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  // 지역 옵션 생성
  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(schools.map(s => s.region))).sort()
    return [
      { label: '전체', value: 'all' },
      ...regions.map(region => ({ label: region, value: region })),
    ]
  }, [schools])

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
  const filteredSchools = useMemo(() => {
    let filtered = schools

    // 검색어 필터
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filtered = filtered.filter(
        school =>
          school.name.toLowerCase().includes(searchLower) ||
          school.contactPerson?.toLowerCase().includes(searchLower) ||
          school.contactEmail?.toLowerCase().includes(searchLower)
      )
    }

    // 지역 필터
    if (params.region && params.region !== 'all') {
      filtered = filtered.filter(school => school.region === params.region)
    }

    return filtered
  }, [schools, params.search, params.region])

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

  const handleFormSubmit = async (data: SchoolFormData) => {
    setFormLoading(true)
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, data)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createSchool(data)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchSchools()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSchool ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'SchoolFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
  }

  // 학교 수정
  const handleEditClick = (school: School) => {
    openFormModal(school)
  }

  // 학교 삭제
  const handleDeleteClick = (school: School) => {
    setDeletingSchool(school)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSchool) return

    setDeleteLoading(true)
    try {
      await deleteSchool(deletingSchool.id)
      showSuccessMessage(MESSAGES.success.deleted)
      setDeleteModalOpen(false)
      setDeletingSchool(null)
      fetchSchools()
    } catch (error) {
      handleError(error, { defaultMessage: '학교 삭제에 실패했습니다.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDeletingSchool(null)
  }

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
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            학교 등록
          </Button>
        )}
      </div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '학교명/담당자/이메일',
            placeholder: '학교명, 담당자, 이메일을 입력하세요',
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

      <SchoolList
        data={filteredSchools}
        loading={loading}
        onEdit={canWrite ? handleEditClick : undefined}
        onDelete={canWrite ? handleDeleteClick : undefined}
      />

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '학교 수정' : '학교 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        destroyOnClose
      >
        <SchoolForm
          key={editingSchool?.id || 'new'} // 수정 모드일 때는 school.id를 key로 사용하여 컴포넌트 재마운트
          school={editingSchool || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="학교 삭제"
        content={deletingSchool ? `정말로 이 학교를 삭제하시겠습니까?` : ''}
        warningMessage="삭제된 학교는 복구할 수 없습니다."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="삭제"
        cancelText="취소"
        danger
      />
    </div>
  )
}
