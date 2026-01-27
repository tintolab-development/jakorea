/**
 * 신청 경로 목록 페이지
 * V3 Phase 7: 신청 경로 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationPathList } from '@/features/application-path/ui/application-path-list'
import { ApplicationPathForm } from '@/features/application-path/ui/application-path-form'
import { useApplicationPathStore } from '@/features/application-path/model/application-path-store'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { PermissionButton } from '@/shared/components'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import type { ApplicationPath, ApplicationPathType } from '@/types/domain'
import type { ApplicationPathFormData } from '@/entities/application-path/model/schema'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'

interface ApplicationPathQueryParams extends Record<string, string | undefined> {
  search?: string
  programId?: string
  pathType?: ApplicationPathType
  status?: 'true' | 'false'
}

export function ApplicationPathListPage() {
  const { paths, loading, fetchPaths, createPath, updatePath, deletePath } =
    useApplicationPathStore()
  const { params, setParams, clearParams } = useQueryParams<ApplicationPathQueryParams>()
  const { getByIdSync, getAllSync } = useProgramService()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPath, setEditingPath] = useState<ApplicationPath | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // 쿼리 파라미터에서 필터 상태 초기화
  const searchKeyword = params.search || ''
  const selectedProgramId = params.programId
  const selectedPathType = params.pathType
  const selectedStatus =
    params.status === 'true' ? true : params.status === 'false' ? false : undefined

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  // 필터링된 데이터
  const filteredPaths = useMemo(() => {
    return paths.filter(path => {
      // 검색어 필터 (프로그램 이름으로 검색)
      if (searchKeyword) {
        const program = getByIdSync(path.programId)
        const programName = program?.title || ''
        if (!programName.toLowerCase().includes(searchKeyword.toLowerCase())) {
          return false
        }
      }

      // 프로그램 필터
      if (selectedProgramId && path.programId !== selectedProgramId) {
        return false
      }

      // 신청 경로 타입 필터
      if (selectedPathType && path.pathType !== selectedPathType) {
        return false
      }

      // 상태 필터
      if (selectedStatus !== undefined && path.isActive !== selectedStatus) {
        return false
      }

      return true
    })
  }, [paths, searchKeyword, selectedProgramId, selectedPathType, selectedStatus])

  const handleCreate = () => {
    setEditingPath(null)
    setFormModalOpen(true)
  }

  const handleEdit = (path: ApplicationPath) => {
    setEditingPath(path)
    setFormModalOpen(true)
  }

  const handleDelete = async (path: ApplicationPath) => {
    if (!confirm(MESSAGES.confirm.delete)) return
    try {
      await deletePath(path.id)
      showSuccessMessage(MESSAGES.success.deleted)
    } catch (error) {
      handleError(error, { context: 'ApplicationPathListPage -> handleDelete' })
    }
  }

  const handleView = (path: ApplicationPath) => {
    // TODO: 상세 보기 Drawer 구현 (선택사항)
    console.log('View application path:', path)
  }

  const handleFormSubmit = async (formData: ApplicationPathFormData) => {
    setFormLoading(true)
    try {
      if (editingPath) {
        await updatePath(editingPath.id, formData)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createPath(formData)
        showSuccessMessage(MESSAGES.success.created)
      }
      setFormModalOpen(false)
      setEditingPath(null)
    } catch (error) {
      handleError(error, { context: 'ApplicationPathListPage -> handleFormSubmit' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingPath(null)
  }

  const programs = getAllSync()

  // 필터 변경 핸들러 (쿼리 파라미터 동기화)
  const handleFilterChange = (key: keyof ApplicationPathQueryParams, value: any) => {
    if (key === 'status') {
      setParams({ status: value === 'true' ? 'true' : value === 'false' ? 'false' : undefined })
    } else {
      setParams({ [key]: value || undefined })
    }
  }

  const handleSearchChange = (value: string) => {
    setParams({ search: value || undefined })
  }

  // 필터 초기화
  const handleResetFilters = () => {
    clearParams()
  }

  // 프로그램 옵션
  const programOptions = useMemo(() => {
    return programs.map(program => ({
      label: program.title,
      value: program.id,
    }))
  }, [programs])

  return (
    <div>
      <Space
        style={{
          marginBottom: LAYOUT_CONSTANTS.margins.lg,
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        {/* <h1 style={{ margin: 0 }}>신청 경로 관리</h1> */}
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          allowedRoles={['ADMIN']}
        >
          신청 경로 등록
        </PermissionButton>
      </Space>

      {/* 필터 영역 */}
      <ListPageFilters
        filters={{
          programId: selectedProgramId,
          pathType: selectedPathType,
          status: selectedStatus,
        }}
        onFilterChange={handleFilterChange}
        searchValue={searchKeyword}
        onSearchChange={handleSearchChange}
        searchLabel="프로그램명"
        searchPlaceholder="프로그램 이름을 입력하세요"
        filterConfig={[
          {
            key: 'programId',
            type: 'select',
            options: programOptions,
            placeholder: '프로그램 선택',
            style: { width: LAYOUT_CONSTANTS.widths.search },
          },
          {
            key: 'pathType',
            type: 'select',
            options: [
              { label: '구글폼', value: 'google_form' },
              { label: '자동화 프로그램', value: 'internal' },
            ],
            placeholder: '신청 경로 타입',
            style: { width: LAYOUT_CONSTANTS.widths.filter },
          },
          {
            key: 'status',
            type: 'select',
            options: [
              { label: '활성', value: 'true' },
              { label: '비활성', value: 'false' },
            ],
            placeholder: '상태',
            style: { width: LAYOUT_CONSTANTS.widths.status },
          },
        ]}
        onReset={handleResetFilters}
        showReset={
          !!(searchKeyword || selectedProgramId || selectedPathType || selectedStatus !== undefined)
        }
      />

      <ApplicationPathList
        data={filteredPaths}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={formModalOpen}
        title={editingPath ? '신청 경로 수정' : '신청 경로 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.large}
        destroyOnHidden
      >
        <ApplicationPathForm
          path={editingPath || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}
