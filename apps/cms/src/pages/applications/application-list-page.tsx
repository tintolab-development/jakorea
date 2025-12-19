/**
 * 신청 목록 페이지
 * Phase 2.2: 목록 페이지
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationList } from '@/features/application/ui/application-list'
import { ApplicationDetailDrawer } from '@/features/application/ui/application-detail-drawer'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useApplicationStore } from '@/features/application/model/application-store'
import type { Application } from '@/types/domain'

export function ApplicationListPage() {
  const navigate = useNavigate()
  const { applications, loading, fetchApplications, deleteApplication, updateStatus } = useApplicationStore()
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleView = (application: Application) => {
    setSelectedApplication(application)
    setDrawerOpen(true)
  }

  const handleEdit = (application: Application) => {
    navigate(`/applications/${application.id}/edit`)
  }

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return

    try {
      await deleteApplication(applicationToDelete.id)
      message.success('신청이 삭제되었습니다')
      setDeleteModalOpen(false)
      setApplicationToDelete(null)
      if (selectedApplication?.id === applicationToDelete.id) {
        setDrawerOpen(false)
        setSelectedApplication(null)
      }
    } catch {
      message.error('삭제 중 오류가 발생했습니다')
    }
  }

  const handleStatusChange = async (application: Application, status: Application['status']) => {
    try {
      await updateStatus(application.id, status)
      message.success(`상태가 "${status}"로 변경되었습니다`)
      if (selectedApplication?.id === application.id) {
        const updated = applications.find(a => a.id === application.id)
        if (updated) setSelectedApplication(updated)
      }
    } catch {
      message.error('상태 변경 중 오류가 발생했습니다')
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/applications/new')}>
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
            setDrawerOpen(false)
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

