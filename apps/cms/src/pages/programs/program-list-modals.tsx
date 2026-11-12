import { ContentModal, DeleteGuideModal } from '@/shared/ui'
import { ProgramForm } from '@/features/program/general/ui/program-form'
import { EnrollmentStatusDetailModal } from '@/features/program/general/ui/enrollment-status-detail-modal'
import { resolveProgramDeleteGuideModalCopyWithNames } from '@/features/program/shared/lib/program-delete-guide'
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
  /** 삭제 안내에 보일 프로그램명 — 없으면 기존 문구 (QA-0296) */
  deleteProgramName?: string
  onConfirmDelete: () => void
  onCancelDelete: () => void

  // Recruitment Modals
  selectedProgramForModal: Program | null
  onCancelEnrollmentModal: () => void
}

export function ProgramListModals({
  formModalOpen,
  isEditingMode,
  editingProgram,
  onFormSubmit,
  onFormCancel,
  formLoading,
  deleteModalOpen,
  deleteProgramName,
  onConfirmDelete,
  onCancelDelete,
  selectedProgramForModal,
  onCancelEnrollmentModal,
}: ProgramListModalsProps) {
  const deleteGuide = resolveProgramDeleteGuideModalCopyWithNames(
    1,
    deleteProgramName ? [deleteProgramName] : []
  )
  return (
    <>
      <EnrollmentStatusDetailModal
        open={!!selectedProgramForModal}
        program={selectedProgramForModal}
        onCancel={onCancelEnrollmentModal}
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

      <DeleteGuideModal
        open={deleteModalOpen}
        title={deleteGuide.title}
        lines={deleteGuide.lines}
        confirmText="삭제"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}
