/**
 * 강사 배정 취소 완료 안내 모달
 * 배정 취소 처리 직후 노출.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'

const UNASSIGN_COMPLETE_MODAL_WIDTH = 560
/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const UNASSIGN_COMPLETE_MODAL_Z_INDEX = 2500

export interface SchoolDetailUnassignCompleteModalProps {
  open: boolean
  onClose: () => void
  /** 배정 취소된 강사명 */
  instructorNames: string[]
  /** 배정 취소된 기관명(학교명) */
  targetNames: string[]
  /** 취소 사유 */
  reason: string
}

function formatBracketedBoldNames(names: string[], fallback: string): string {
  if (names.length === 0) {
    return `[**${fallback}**]`
  }
  return names.map(name => `[**${name.trim() || fallback}**]`).join(', ')
}

export function buildInstructorAssignmentUnassignCompleteDescription(
  instructorNames: string[],
  targetNames: string[],
  reason: string
): string {
  const instructors = formatBracketedBoldNames(instructorNames, '강사')
  const targets = formatBracketedBoldNames(targetNames, '기관')
  const instructorLabel = instructorNames.length > 1 ? '강사님들의' : '강사님의'
  const trimmedReason = reason.trim() || '-'

  return `${instructors} ${instructorLabel} ${targets} 배정이 취소 되었습니다.\n(사유 : ${trimmedReason})`
}

export function SchoolDetailUnassignCompleteModal({
  open,
  onClose,
  instructorNames,
  targetNames,
  reason,
}: SchoolDetailUnassignCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 배정 취소 완료"
      width={UNASSIGN_COMPLETE_MODAL_WIDTH}
      zIndex={UNASSIGN_COMPLETE_MODAL_Z_INDEX}
      description={buildInstructorAssignmentUnassignCompleteDescription(
        instructorNames,
        targetNames,
        reason
      )}
      footer={
        <CmsButton variant="secondary" size="large" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
