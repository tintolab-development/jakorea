/**
 * 강사 배정 취소 안내 모달
 * 배정된 강사/기관 목록에서 선택 후 "배정 취소" 클릭 시 노출.
 * `PermissionModal` — 취소 사유 + 알림 발송(즉시 / 직접 설정)
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'

export interface SchoolDetailUnassignConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 배정 취소 대상 강사명 */
  instructorNames: string[]
  /** 배정 취소 대상 기관명(학교명) */
  targetNames: string[]
  onConfirm: (payload: PermissionModalPayload) => void
}

function formatBracketedBoldNames(names: string[], fallback: string): string {
  if (names.length === 0) {
    return `[**${fallback}**]`
  }
  return names.map(name => `[**${name.trim() || fallback}**]`).join(', ')
}

export function buildInstructorAssignmentUnassignMessage(
  instructorNames: string[],
  targetNames: string[]
): string {
  const instructors = formatBracketedBoldNames(instructorNames, '강사')
  const targets = formatBracketedBoldNames(targetNames, '기관')
  const instructorLabel = instructorNames.length > 1 ? '강사님들의' : '강사님의'

  return `${instructors} ${instructorLabel} ${targets} 배정을 취소하시겠습니까?\n취소 시 입력하신 취소 사유가 강사님에게 전달되며, 알림이 발송됩니다.\n또한, 해당 강사님은 자동으로 해당 기관의 배정 현황 목록에서 제거됩니다.`
}

export function SchoolDetailUnassignConfirmModal({
  open,
  onCancel,
  instructorNames,
  targetNames,
  onConfirm,
}: SchoolDetailUnassignConfirmModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="school-detail-unassign-confirm-modal"
      title="강사 배정 취소 안내"
      message={buildInstructorAssignmentUnassignMessage(instructorNames, targetNames)}
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
