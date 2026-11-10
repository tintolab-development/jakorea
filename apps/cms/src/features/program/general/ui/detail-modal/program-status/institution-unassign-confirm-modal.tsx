/**
 * 일반 프로그램(기관형) 참여 강사·참여 봉사자 상세 — 배정 취소 안내 (Figma 06-2 06-1 / 07-2 06-1).
 *
 * - 알림 발송 전(`notificationSent === false`, 06-1): 사유·알림 입력 없이 안내 + [취소][배정 취소]
 * - 알림 발송 후 또는 판단 불가(06-2): 취소 사유 → 알림 발송(즉시 / 직접 설정)
 * - 단건 「기관 배정 취소 안내」 · 일괄 「기관 일괄 배정 취소 안내」 ("[A] 외 N개의 기관의 배정을…")
 * - 취소 귀책 필드 없음 — API 선택값(생략 시 서버 ADMIN)
 *
 * 1사1교·개인형은 이 모달을 쓰지 않고 기존 `SchoolDetailUnassignConfirmModal` 기본 동작을 유지한다.
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'

export type InstitutionUnassignAudience = 'instructor' | 'volunteer'

export interface InstitutionUnassignConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  /** 배정 취소 대상 기관명 — 2개 이상이면 일괄 문구 */
  targetNames: string[]
  audience: InstitutionUnassignAudience
  /** `false`일 때만 발송 전 시안. `true`·미지정은 발송 후 시안 */
  notificationSent?: boolean
  confirmLoading?: boolean
}

export function resolveInstitutionUnassignTitle(targetCount: number): string {
  return targetCount > 1 ? '기관 일괄 배정 취소 안내' : '기관 배정 취소 안내'
}

export function buildInstitutionUnassignMessage(input: {
  targetNames: string[]
  audience: InstitutionUnassignAudience
  notificationSent: boolean
}): string {
  const first = input.targetNames[0]?.trim() || '기관'
  const extra = input.targetNames.length - 1
  const subject = extra > 0 ? `[**${first}**] **외 ${extra}개**의 기관` : `[**${first}**]`
  const listLabel = input.audience === 'instructor' ? '강사 배정 현황' : '봉사 배정 현황'
  const head = `${subject}의 배정을 취소하시겠습니까?`

  if (!input.notificationSent) {
    return `${head}\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소되며,\n해당 기관의 ${listLabel} 목록에서도 제외됩니다.`
  }
  const sentLine = '취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.'
  if (input.audience === 'volunteer') {
    return `${head}\n${sentLine}`
  }
  return `${head}\n${sentLine}\n또한, 해당 기관의 ${listLabel} 목록에서도 제외됩니다.`
}

export function InstitutionUnassignConfirmModal({
  open,
  onCancel,
  onConfirm,
  targetNames,
  audience,
  notificationSent,
  confirmLoading = false,
}: InstitutionUnassignConfirmModalProps) {
  const sent = notificationSent !== false
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="school-detail-unassign-confirm-modal"
      title={resolveInstitutionUnassignTitle(targetNames.length)}
      message={buildInstitutionUnassignMessage({ targetNames, audience, notificationSent: sent })}
      confirmLabel="배정 취소"
      confirmVariant="delete"
      confirmLoading={confirmLoading}
      requireReason={sent}
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      showNotifyTiming={sent}
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
