/**
 * 봉사자 배정 취소 안내 모달
 * 배정된 기관 목록에서 선택 후 "배정 취소" 클릭 시 노출.
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'

export interface ParticipatingVolunteerUnassignConfirmModalProps {
  open: boolean
  onCancel: () => void
  volunteerNames: string[]
  targetNames: string[]
  onConfirm: (payload: PermissionModalPayload) => void
}

function formatBracketedBoldNames(names: string[], fallback: string): string {
  if (names.length === 0) {
    return `[**${fallback}**]`
  }
  return names.map(name => `[**${name.trim() || fallback}**]`).join(', ')
}

export function buildVolunteerAssignmentUnassignMessage(
  volunteerNames: string[],
  targetNames: string[]
): string {
  const volunteers = formatBracketedBoldNames(volunteerNames, '봉사자')
  const targets = formatBracketedBoldNames(targetNames, '기관')
  const volunteerLabel = volunteerNames.length > 1 ? '봉사자님들의' : '봉사자님의'

  return `${volunteers} ${volunteerLabel} ${targets} 배정을 취소하시겠습니까?\n취소 시 입력하신 취소 사유가 봉사자님에게 전달되며, 알림이 발송됩니다.\n또한, 해당 봉사자님은 해당 기관의 신청 목록에서 제외됩니다.`
}

export function ParticipatingVolunteerUnassignConfirmModal({
  open,
  onCancel,
  volunteerNames,
  targetNames,
  onConfirm,
}: ParticipatingVolunteerUnassignConfirmModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="school-detail-unassign-confirm-modal"
      title="봉사자 배정 취소 안내"
      message={buildVolunteerAssignmentUnassignMessage(volunteerNames, targetNames)}
      confirmLabel="배정 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="two"
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
