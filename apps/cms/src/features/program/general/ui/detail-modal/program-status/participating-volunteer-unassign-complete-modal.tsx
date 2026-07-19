/**
 * 봉사자 배정 취소 완료 안내 모달
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'

const UNASSIGN_COMPLETE_MODAL_WIDTH = 600
const UNASSIGN_COMPLETE_MODAL_Z_INDEX = 2500

export interface ParticipatingVolunteerUnassignCompleteModalProps {
  open: boolean
  onClose: () => void
  volunteerNames: string[]
  targetNames: string[]
  reason: string
}

function formatBracketedBoldNames(names: string[], fallback: string): string {
  if (names.length === 0) {
    return `[**${fallback}**]`
  }
  return names.map(name => `[**${name.trim() || fallback}**]`).join(', ')
}

export function buildVolunteerAssignmentUnassignCompleteDescription(
  volunteerNames: string[],
  targetNames: string[],
  reason: string
): string {
  const volunteers = formatBracketedBoldNames(volunteerNames, '봉사자')
  const targets = formatBracketedBoldNames(targetNames, '기관')
  const volunteerLabel = volunteerNames.length > 1 ? '봉사자님들의' : '봉사자님의'
  const trimmedReason = reason.trim() || '-'

  return `${volunteers} ${volunteerLabel} ${targets} 배정이 취소 되었습니다.\n(사유 : ${trimmedReason})`
}

export function ParticipatingVolunteerUnassignCompleteModal({
  open,
  onClose,
  volunteerNames,
  targetNames,
  reason,
}: ParticipatingVolunteerUnassignCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 배정 취소 완료"
      width={UNASSIGN_COMPLETE_MODAL_WIDTH}
      zIndex={UNASSIGN_COMPLETE_MODAL_Z_INDEX}
      description={buildVolunteerAssignmentUnassignCompleteDescription(
        volunteerNames,
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
