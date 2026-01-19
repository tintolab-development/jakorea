/**
 * 매칭 목록 페이지
 * Phase 0.3.6: 매칭 관리 UI
 */

import { Button, Space, Modal, Typography } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { MatchingList } from '@/features/matching/ui/matching-list'
import { MatchingDetailDrawer } from '@/features/matching/ui/matching-detail-drawer'
import { MatchingForm } from '@/features/matching/ui/matching-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useMatchingManagement } from '@/features/matching/hooks/use-matching-management'
import './matching-list-page.css'

export function MatchingListPage() {
  const {
    matchings,
    loading,
    selectedMatching,
    selectedProgramId,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingMatching,
    setProgramFilter,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    submitForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    confirmMatching,
    requestCancel,
  } = useMatchingManagement()

  return (
    <div>
      <Space className="matching-list-header">
        <div>
          <h1 className="matching-list-title">매칭 관리</h1>
          <Typography.Text type="secondary">
            프로그램별 강사 매칭 현황을 관리합니다.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => openForm()}>
          매칭 등록
        </Button>
      </Space>

      <MatchingList
        matchings={matchings}
        loading={loading}
        selectedProgramId={selectedProgramId}
        onProgramChange={setProgramFilter}
        onView={openDrawer}
        onEdit={openForm}
        onDelete={openDeleteConfirm}
        onConfirm={confirmMatching}
        onCancel={requestCancel}
      />

      <MatchingDetailDrawer
        open={drawerOpen}
        matching={selectedMatching}
        onClose={closeDrawer}
        onEdit={() => selectedMatching && openForm(selectedMatching)}
        onDelete={() => selectedMatching && openDeleteConfirm(selectedMatching)}
        onConfirm={() => selectedMatching && confirmMatching(selectedMatching)}
        onCancel={() => selectedMatching && requestCancel(selectedMatching)}
        loading={loading}
      />

      <Modal
        title={editingMatching ? '매칭 수정' : '매칭 등록'}
        open={formModalOpen}
        onCancel={closeForm}
        footer={null}
        width={800}
      >
        <MatchingForm
          matching={editingMatching || undefined}
          onSubmit={submitForm}
          onCancel={closeForm}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="매칭 삭제"
        content="정말 이 매칭을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

