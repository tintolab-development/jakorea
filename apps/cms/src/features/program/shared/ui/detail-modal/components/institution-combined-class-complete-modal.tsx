import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  COMBINED_CLASS_COMPLETE_MODAL_TITLE,
  buildCombinedClassCompleteDescription,
} from '@/features/program/general/lib/combined-class-copy'

const MODAL_WIDTH = 600

export type InstitutionCombinedClassCompleteModalProps = {
  open: boolean
  teacherLabel: string
  onClose: () => void
  zIndex?: number
}

export function InstitutionCombinedClassCompleteModal({
  open,
  teacherLabel,
  onClose,
  zIndex,
}: InstitutionCombinedClassCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={COMBINED_CLASS_COMPLETE_MODAL_TITLE}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      description={buildCombinedClassCompleteDescription(teacherLabel)}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
