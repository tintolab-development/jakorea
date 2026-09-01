/**
 * 일반 프로그램 — 강사 개별 승인 완료 안내 (600×222)
 */

import type { InstructorLectureAssignItem } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
/** 강사비 승인 모달(`InstructorFeeApprovalModal` z≈2500) 위에 표시 */
export const INSTRUCTOR_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstructorApprovalCompleteModalProps = {
  open: boolean
  instructorName: string
  assignedInstitutionCount: number
  onClose: () => void
  zIndex?: number
}

export function countAssignedInstitutions(
  assignments: ReadonlyArray<Pick<InstructorLectureAssignItem, 'schoolId'>>
): number {
  return new Set(assignments.map(item => item.schoolId).filter(Boolean)).size
}

export function buildInstructorApprovalCompleteDescription(
  instructorName: string,
  assignedInstitutionCount: number
): string {
  const trimmedName = instructorName.trim() || '강사'
  const firstLine = `[${trimmedName}] 강사님의 프로그램 참여가 승인 되었습니다.`
  if (assignedInstitutionCount <= 0) {
    return firstLine
  }
  return `${firstLine}\n(현재 배정 기관 : ${assignedInstitutionCount}개)`
}

export function InstructorApprovalCompleteModal({
  open,
  instructorName,
  assignedInstitutionCount,
  onClose,
  zIndex = INSTRUCTOR_APPROVAL_COMPLETE_MODAL_Z,
}: InstructorApprovalCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-approval-complete-modal"
      description={buildInstructorApprovalCompleteDescription(
        instructorName,
        assignedInstitutionCount
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
