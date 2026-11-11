/**
 * 일반 프로그램(기관형) 참여 봉사자 상세 — 기관 배정 취소 안내 (Figma 07-2 06-1 / 06-2).
 *
 * - 빠지는 기관의 배정 알림이 발송 전(`notificationSent === false`): 발송 전 안내 + 취소 사유.
 *   알림 시점 입력 없음 — BE가 예약 알림만 중단하고 취소 알림은 보내지 않는다.
 * - 발송 후(`true`) 또는 판단 불가(`undefined`, 구버전 응답): 취소 사유 + 알림 시점(즉시 / 직접 설정).
 * - 취소 사유는 두 경우 모두 필수 — PUT …/assigned-organizations `reason`(2~500자)이 필수다.
 *
 * 강사 배정 취소는 `InstitutionUnassignConfirmModal`을 그대로 쓴다(발송 전이면 사유 없음).
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import {
  buildInstitutionUnassignMessage,
  resolveInstitutionUnassignTitle,
} from './institution-unassign-confirm-modal'

export interface VolunteerInstitutionUnassignConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  /** 배정 취소 대상 기관명 — 2개 이상이면 일괄 문구 */
  targetNames: string[]
  /** `false`일 때만 발송 전 시안. `true`·미지정은 발송 후 시안 */
  notificationSent?: boolean
  confirmLoading?: boolean
}

export function VolunteerInstitutionUnassignConfirmModal({
  open,
  onCancel,
  onConfirm,
  targetNames,
  notificationSent,
  confirmLoading = false,
}: VolunteerInstitutionUnassignConfirmModalProps) {
  const sent = notificationSent !== false
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="school-detail-unassign-confirm-modal"
      title={resolveInstitutionUnassignTitle(targetNames.length)}
      message={buildInstitutionUnassignMessage({
        targetNames,
        audience: 'volunteer',
        notificationSent: sent,
      })}
      confirmLabel="배정 취소"
      confirmVariant="delete"
      confirmLoading={confirmLoading}
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      reasonMinLength={2}
      reasonMinLengthMessage="취소 사유를 2자 이상 입력해 주세요."
      showNotifyTiming={sent}
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
