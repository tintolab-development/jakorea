import { ContentModal } from '@/shared/ui'
import { ProgramForm } from '@/features/program/general/ui/program-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { EnrollmentStatusDetailModal } from '@/features/program/general/ui/enrollment-status-detail-modal'
import { InstructorRecruitmentDetailModal } from '@/features/program/general/ui/instructor-recruitment-detail-modal'
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

}

export function ProgramListModals({
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
}: ProgramListModalsProps) {
  return (
    <>
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

      <ContentModal
        open={formModalOpen}
        title={isEditingMode ? '프로그램 수정' : '프로그램 등록'}
        onCancel={onFormCancel}
        width={LAYOUT_CONSTANTS.widths.modal.xlarge}
        zIndex={1001}
      >
        <ProgramForm
          key={editingProgram?.id || 'new'}
          program={editingProgram || undefined}
          onSubmit={onFormSubmit}
          onCancel={onFormCancel}
          loading={formLoading}
        />
      </ContentModal>

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
