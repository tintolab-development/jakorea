/**
 * 신청 목록 페이지
 * Phase 2.2: 목록 페이지
 */

import { useState, useEffect } from 'react'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationList } from '@/features/application/ui/application-list'
import { ApplicationDetailDrawer } from '@/features/application/ui/application-detail-drawer'
import { ApplicationForm } from '@/features/application/ui/application-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useApplicationStore } from '@/features/application/model/application-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import type { Application } from '@/types/domain'
import type { ApplicationFormData } from '@/entities/application/model/schema'

export function ApplicationListPage() {
  const { applications, loading, fetchApplications, createApplication, updateApplication, deleteApplication, updateStatus } = useApplicationStore()
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleView = (application: Application) => {
    setSelectedApplication(application)
    setDrawerOpen(true)
  }

  const handleEdit = (application: Application) => {
    setEditingApplication(application)
    setDrawerOpen(false)
    setFormModalOpen(true)
  }

  const handleFormSubmit = async (data: ApplicationFormData) => {
    setFormLoading(true)
    try {
      if (editingApplication) {
        await updateApplication(editingApplication.id, data)
        showSuccessMessage('신청이 수정되었습니다')
      } else {
        await createApplication(data)
        showSuccessMessage('신청이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingApplication(null)
      fetchApplications()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingApplication ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'ApplicationFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingApplication(null)
  }

  const handleNewClick = () => {
    setEditingApplication(null)
    setFormModalOpen(true)
  }

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return

    try {
      await deleteApplication(applicationToDelete.id)
      showSuccessMessage('신청이 삭제되었습니다')
      setDeleteModalOpen(false)
      setApplicationToDelete(null)
      if (selectedApplication?.id === applicationToDelete.id) {
        setDrawerOpen(false)
        setSelectedApplication(null)
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: '삭제 중 오류가 발생했습니다',
        context: 'ApplicationDelete',
      })
    }
  }

  const handleStatusChange = async (application: Application, status: Application['status']) => {
    try {
      await updateStatus(application.id, status)
      showSuccessMessage(`상태가 "${status}"로 변경되었습니다`)
      if (selectedApplication?.id === application.id) {
        const updated = applications.find(a => a.id === application.id)
        if (updated) setSelectedApplication(updated)
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'ApplicationStatusChange',
      })
    }
  }

  const handleStatusChangeInDrawer = async (status: Application['status']) => {
    if (!selectedApplication) return
    await handleStatusChange(selectedApplication, status)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>신청 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
          신청 등록
        </Button>
      </Space>

      <ApplicationList
        data={applications}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChange}
      />

      <ApplicationDetailDrawer
        open={drawerOpen}
        application={selectedApplication}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedApplication(null)
        }}
        onEdit={() => {
          if (selectedApplication) {
            handleEdit(selectedApplication)
          }
        }}
        onDelete={() => {
          if (selectedApplication) {
            setDrawerOpen(false)
            handleDeleteClick(selectedApplication)
          }
        }}
        onStatusChange={handleStatusChangeInDrawer}
        loading={loading}
      />

      <Modal
        open={formModalOpen}
        title={editingApplication ? '신청 수정' : '신청 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ApplicationForm
          application={editingApplication || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="신청 삭제"
        content="정말 이 신청을 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false)
          setApplicationToDelete(null)
        }}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

