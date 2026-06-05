import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstitutionApprovalCompleteModalProps = {
  open: boolean
  schoolName: string
  assignedInstructorCount: number
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionApprovalCompleteDescription(
  schoolName: string,
  assignedInstructorCount: number
): string {
  const trimmedName = schoolName.trim() || '기관'
  const firstLine = `[${trimmedName}]의 프로그램 참여가 승인 되었습니다.`
  return `${firstLine}\n(현재 배정 강사 : ${assignedInstructorCount}명)`
}

export function InstitutionApprovalCompleteModal({
  open,
  schoolName,
  assignedInstructorCount,
  onClose,
  zIndex = INSTITUTION_APPROVAL_COMPLETE_MODAL_Z,
}: InstitutionApprovalCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-approval-complete-modal"
      description={buildInstitutionApprovalCompleteDescription(
        schoolName,
        assignedInstructorCount
      )}
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
