/**
 * 신청 경로 목록 페이지
 * V3 Phase 7: 신청 경로 관리
 */

import { useState, useEffect } from 'react'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationPathList } from '@/features/application-path/ui/application-path-list'
import { ApplicationPathForm } from '@/features/application-path/ui/application-path-form'
import { useApplicationPathStore } from '@/features/application-path/model/application-path-store'
import type { ApplicationPath } from '@/types/domain'
import type { ApplicationPathFormData } from '@/entities/application-path/model/schema'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'

export function ApplicationPathListPage() {
  const { paths, loading, fetchPaths, createPath, updatePath, deletePath } = useApplicationPathStore()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPath, setEditingPath] = useState<ApplicationPath | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

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

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'flex-end', width: '100%' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          신청 경로 등록
        </Button>
      </Space>
      <ApplicationPathList
        data={paths}
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

