import { Modal } from 'antd'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { ProgramDetailFullPageModal } from '@/features/program/ui/detail-modal/program-detail-fullpage-modal'
import { ProgramForm } from '@/features/program/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { EnrollmentStatusDetailModal } from '@/features/program/ui/enrollment-status-detail-modal'
import { InstructorRecruitmentDetailModal } from '@/features/program/ui/instructor-recruitment-detail-modal'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import type { Program } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'

interface ProgramListModalsProps {
  // Drawer
  drawerOpen: boolean
  drawerProgram: Program | null
  onCloseDrawer: () => void
  onEditFromDrawer: () => void
  onDeleteFromDrawer: () => void
  loading: boolean

  // Form Modal
  formModalOpen: boolean
  isEditingMode: boolean
  editingProgram: Program | null
  onFormSubmit: (data: ProgramFormData) => Promise<void>
  onFormCancel: () => void
  formLoading: boolean

  // Delete Modal
  deleteModalOpen: boolean
  deleteConfirmMessage: string
  onConfirmDelete: () => void
  onCancelDelete: () => void

  // Recruitment Modals
  selectedProgramForModal: Program | null
  onCancelEnrollmentModal: () => void
  selectedProgramForInstructorModal: Program | null
  onCancelInstructorModal: () => void

  // Full-page detail modal (economy/education list row click)
  selectedProgramForFullPageModal: Program | null
  onCloseFullPageModal: () => void
}

export function ProgramListModals({
  drawerOpen,
  drawerProgram,
  onCloseDrawer,
  onEditFromDrawer,
  onDeleteFromDrawer,
  loading,
  formModalOpen,
  isEditingMode,
  editingProgram,
  onFormSubmit,
  onFormCancel,
  formLoading,
  deleteModalOpen,
  deleteConfirmMessage,
  onConfirmDelete,
  onCancelDelete,
  selectedProgramForModal,
  onCancelEnrollmentModal,
  selectedProgramForInstructorModal,
  onCancelInstructorModal,
  selectedProgramForFullPageModal,
  onCloseFullPageModal,
}: ProgramListModalsProps) {
  return (
    <>
      <ProgramDetailFullPageModal
        open={!!selectedProgramForFullPageModal}
        program={selectedProgramForFullPageModal}
        onClose={onCloseFullPageModal}
      />
      <EnrollmentStatusDetailModal
        open={!!selectedProgramForModal}
        program={selectedProgramForModal}
        onCancel={onCancelEnrollmentModal}
      />
      <InstructorRecruitmentDetailModal
        open={!!selectedProgramForInstructorModal}
        program={selectedProgramForInstructorModal}
        onCancel={onCancelInstructorModal}
      />

      <ProgramDetailDrawer
        open={drawerOpen}
        program={drawerProgram || undefined}
        onClose={onCloseDrawer}
        onEdit={onEditFromDrawer}
        onDelete={onDeleteFromDrawer}
        loading={loading}
      />

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '프로그램 수정' : '프로그램 등록'}
        onCancel={onFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.xlarge}
        destroyOnClose
        zIndex={1001}
      >
        <ProgramForm
          key={editingProgram?.id || 'new'}
          program={editingProgram || undefined}
          onSubmit={onFormSubmit}
          onCancel={onFormCancel}
          loading={formLoading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="프로그램 삭제"
        content={deleteConfirmMessage}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        confirmText="삭제"
        cancelText="취소"
        danger
      />
    </>
  )
}
