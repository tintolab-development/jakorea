/**
 * 신청 목록 페이지
 * Phase 2.2: 목록 페이지
 */

import { Button, Space, Modal, Typography, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApplicationList } from '@/features/application/ui/application-list'
import { ApplicationDetailDrawer } from '@/features/application/ui/application-detail-drawer'
import { ApplicationForm } from '@/features/application/ui/application-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { Application } from '@/types/domain'
import { useApplicationReview } from '@/features/application/hooks/use-application-review'
import './application-list-page.css'

export function ApplicationListPage() {
  const {
    applications,
    selectedApplication,
    loading,
    isAdmin,
    currentUser,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingApplication,
    rejectModalOpen,
    rejectionReason,
    setRejectionReason,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    submitForm,
    changeStatus,
    requestReject,
    confirmReject,
    cancelReject,
  } = useApplicationReview()

  const handleStatusChangeInDrawer = async (status: Application['status'], rejectionReason?: string) => {
    if (!selectedApplication) return
    await changeStatus(selectedApplication, status, rejectionReason)
  }

  return (
    <div>
      <Space className="application-list-header">
        <div>
          <h1 className="application-list-title">{isAdmin ? '신청 승인/반려' : '신청 내역'}</h1>
          <Typography.Text type="secondary">
            {isAdmin ? '접수된 신청을 검토하고 승인 또는 반려 처리합니다.' : '내 신청 내역을 확인합니다.'}
          </Typography.Text>
        </div>
        {!isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            신청 등록
          </Button>
        )}
      </Space>

      <ApplicationList
        data={applications}
        loading={loading}
        onView={openDrawer}
        onEdit={openForm}
        onDelete={openDeleteConfirm}
        onStatusChange={changeStatus}
        onReject={requestReject}
        isAdmin={isAdmin}
        currentUser={currentUser}
      />

      <ApplicationDetailDrawer
        open={drawerOpen}
        application={null} // Drawer 내부에서 store의 selectedApplication 사용
        onClose={closeDrawer}
        onEdit={() => {
          if (selectedApplication) openForm(selectedApplication)
        }}
        onDelete={() => {
          if (selectedApplication) openDeleteConfirm(selectedApplication)
        }}
        onStatusChange={handleStatusChangeInDrawer}
        loading={loading}
        isAdmin={isAdmin}
        currentUser={currentUser}
      />

      <Modal
        open={formModalOpen}
        title={editingApplication ? '신청 수정' : '신청 등록'}
        onCancel={closeForm}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <ApplicationForm
          application={editingApplication || undefined}
          onSubmit={submitForm}
          onCancel={closeForm}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="신청 삭제"
        content="정말 이 신청을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
        confirmText="삭제"
        danger
      />

      <Modal
        title="신청 거절"
        open={rejectModalOpen}
        onOk={confirmReject}
        onCancel={cancelReject}
        okText="거절하기"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>이 신청을 거절하시겠습니까?</Typography.Text>
          <Typography.Text type="secondary">거절 사유를 입력해주세요 (선택사항)</Typography.Text>
          <Input.TextArea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="거절 사유를 입력해주세요"
            rows={4}
            maxLength={500}
            showCount
          />
        </Space>
      </Modal>
    </div>
  )
}

