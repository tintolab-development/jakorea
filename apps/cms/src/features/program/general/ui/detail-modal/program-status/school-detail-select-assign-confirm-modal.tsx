/**
 * 선택 배정 확인 모달 (강사 배정 안내 컨펌)
 * 배정 대기 강사 목록에서 강사 선택 후 "선택 배정" 클릭 시 노출.
 * 배정 생성 API에 전달할 알림 시점(즉시/직접 설정)을 여기서 수집한다.
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'

const SELECT_ASSIGN_CONFIRM_MODAL_WIDTH = 600

export interface SchoolDetailSelectAssignConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 배정 대상 기관명 */
  schoolName: string
  /** 선택한 강사명 목록 (배정 대기 목록에서 선택된 행) */
  instructorNames: string[]
  /** 현재 배정된 인원 수 */
  currentCount: number
  /** 필요 배정 인원 수 (분모) */
  requiredCount: number
  /** "강사 배정" 클릭 시 호출 */
  onConfirm: (payload: PermissionModalPayload) => void
  confirmLoading?: boolean
}

function formatBracketedBoldNames(names: string[]): string {
  return names.map(name => `[**${name}**]`).join(', ')
}

function buildSelectAssignConfirmDescription(
  instructorNames: string[],
  schoolName: string,
  currentCount: number,
  requiredCount: number
): string {
  const mainLine =
    instructorNames.length > 0
      ? `${formatBracketedBoldNames(instructorNames)} 강사님을 [**${schoolName}**]에 새로 배정하시겠습니까?`
      : `[**${schoolName}**]에 새로 배정하시겠습니까?`

  return `${mainLine}\n(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}

export function SchoolDetailSelectAssignConfirmModal({
  open,
  onCancel,
  schoolName,
  instructorNames,
  currentCount,
  requiredCount,
  onConfirm,
  confirmLoading = false,
}: SchoolDetailSelectAssignConfirmModalProps) {
  return (
    <PermissionModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLoading={confirmLoading}
      variant="approve"
      title="강사 배정 안내"
      width={SELECT_ASSIGN_CONFIRM_MODAL_WIDTH}
      message={buildSelectAssignConfirmDescription(
        instructorNames,
        schoolName,
        currentCount,
        requiredCount
      )}
      confirmLabel="강사 배정"
      confirmVariant="primary"
      requireReason={false}
      notifyTimingOptions="two"
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.scheduledOnly}
    />
  )
}
