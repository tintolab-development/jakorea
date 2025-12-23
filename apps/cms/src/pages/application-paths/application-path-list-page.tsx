/**
 * 신청 경로 목록 페이지
 * V3 Phase 7: 신청 경로 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { Button, Space, Modal, Input, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationPathList } from '@/features/application-path/ui/application-path-list'
import { ApplicationPathForm } from '@/features/application-path/ui/application-path-form'
import { useApplicationPathStore } from '@/features/application-path/model/application-path-store'
import { programService } from '@/entities/program/api/program-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type { ApplicationPath, ApplicationPathType } from '@/types/domain'
import type { ApplicationPathFormData } from '@/entities/application-path/model/schema'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'

interface ApplicationPathQueryParams extends Record<string, string | undefined> {
  search?: string
  programId?: string
  pathType?: ApplicationPathType
  status?: 'true' | 'false'
}

export function ApplicationPathListPage() {
  const { paths, loading, fetchPaths, createPath, updatePath, deletePath } = useApplicationPathStore()
  const { params, setParams, clearParams } = useQueryParams<ApplicationPathQueryParams>()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPath, setEditingPath] = useState<ApplicationPath | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // 쿼리 파라미터에서 필터 상태 초기화
  const searchKeyword = params.search || ''
  const selectedProgramId = params.programId
  const selectedPathType = params.pathType
  const selectedStatus = params.status === 'true' ? true : params.status === 'false' ? false : undefined

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  // 필터링된 데이터
  const filteredPaths = useMemo(() => {
    return paths.filter(path => {
      // 검색어 필터 (프로그램 이름으로 검색)
      if (searchKeyword) {
        const program = programService.getByIdSync(path.programId)
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
    if (!confirm(`정말 ${path.id} 신청 경로를 삭제하시겠습니까?`)) return
    try {
      await deletePath(path.id)
      showSuccessMessage('신청 경로가 삭제되었습니다.')
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
        showSuccessMessage('신청 경로가 성공적으로 수정되었습니다.')
      } else {
        await createPath(formData)
        showSuccessMessage('신청 경로가 성공적으로 등록되었습니다.')
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

  const programs = programService.getAllSync()

  // 필터 변경 핸들러 (쿼리 파라미터 동기화)
  const handleSearchChange = (value: string) => {
    setParams({ search: value || undefined })
  }

  const handleProgramChange = (value: string | undefined) => {
    setParams({ programId: value || undefined })
  }

  const handlePathTypeChange = (value: ApplicationPathType | undefined) => {
    setParams({ pathType: value || undefined })
  }

  const handleStatusChange = (value: boolean | undefined) => {
    setParams({ status: value === true ? 'true' : value === false ? 'false' : undefined })
  }

  // 필터 초기화
  const handleResetFilters = () => {
    clearParams()
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>신청 경로 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          신청 경로 등록
        </Button>
      </Space>

      {/* 필터 영역 */}
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Input
          placeholder="프로그램 이름으로 검색"
          value={searchKeyword}
          onChange={e => handleSearchChange(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
        <Select
          placeholder="프로그램 선택"
          value={selectedProgramId}
          onChange={handleProgramChange}
          allowClear
          showSearch
          style={{ width: 200 }}
          filterOption={(input, option) => {
            const label = option?.label as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
          options={programs.map(program => ({
            label: program.title,
            value: program.id,
          }))}
        />
        <Select
          placeholder="신청 경로 타입"
          value={selectedPathType}
          onChange={handlePathTypeChange}
          allowClear
          style={{ width: 150 }}
          options={[
            { label: '구글폼', value: 'google_form' },
            { label: '자동화 프로그램', value: 'internal' },
          ]}
        />
        <Select
          placeholder="상태"
          value={selectedStatus}
          onChange={handleStatusChange}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '활성', value: true },
            { label: '비활성', value: false },
          ]}
        />
        <Button onClick={handleResetFilters}>필터 초기화</Button>
      </Space>

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
        width={800}
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

