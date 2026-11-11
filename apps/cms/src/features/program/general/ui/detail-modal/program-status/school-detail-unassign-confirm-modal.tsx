/**
 * 강사 배정 취소 안내 모달
 * 배정된 강사/기관 목록에서 선택 후 "배정 취소" 클릭 시 노출.
 * `PermissionModal` — 취소 사유 → 알림 발송(즉시 / 직접 설정)
 *
 * `variant="institution-detail"` — 일반 기관형 참여 기관 상세 시안(12-1·12-2) 전용.
 * - 알림 발송 전(`notificationSent === false`): 사유·알림 입력 없이 안내만
 * - 알림 발송 후 또는 판단 불가: 취소 사유 + 알림 발송
 * - 단건/일괄 제목·본문 분기, 취소 귀책 필드 없음(API 선택값 — 생략 시 서버 ADMIN)
 * `variant="individual-schedule"` — 일반 개인형 참여 강사 상세 「교육 배정 취소 안내」(03-1·03-2).
 * - 대상은 일정(`targetNames`), 단건/일괄 제목·본문, 발송 전/후 분기는 `institution-detail`과 같고 귀책 없음
 * 기본(`default`)은 1사1교 등 기존 호출부 동작 그대로.
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
  /** 기본 `default`. 일반 기관형 참여 기관 상세는 `institution-detail` */
  variant?: SchoolDetailUnassignConfirmVariant
  /**
   * `institution-detail` 전용 — 선택한 배정의 알림 발송 여부.
   * `false`일 때만 발송 전 시안(사유·알림 없음). `true`·미지정은 발송 후 시안.
   */
  notificationSent?: boolean
  confirmLoading?: boolean
}

/**
 * - `institution-detail`: 일반 기관형 참여 기관 상세 시안(12-1·12-2)
 * - `individual-schedule`: 일반 개인형 참여 강사 상세 「교육 배정 취소 안내」 시안(03-1·03-2) — 대상은 일정
 */
export type SchoolDetailUnassignConfirmVariant =
  | 'default'
  | 'institution-detail'
  | 'individual-schedule'

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

function formatInstitutionUnassignSubject(instructorNames: string[]): string {
  const first = instructorNames[0]?.trim() || '강사'
  const others = instructorNames.length - 1
  return others > 0 ? `[**${first}**] 님 외 ${others}명` : `[**${first}**] 님`
}

/** 시안 12-1(발송 전)·12-2(발송 후) 본문 */
export function buildInstitutionDetailUnassignMessage(
  instructorNames: string[],
  targetName: string,
  notificationSent: boolean
): string {
  const subject = formatInstitutionUnassignSubject(instructorNames)
  const target = `[**${targetName.trim() || '기관'}**]`
  if (!notificationSent) {
    return `${subject}의 배정을 취소하시겠습니까?\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소되며,\n${target}의 강사 배정 현황 목록에서도 제외됩니다.`
  }
  return `${subject}의 배정을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, ${target}의 강사 배정 현황 목록에서도 제외됩니다.`
}

export function resolveInstitutionDetailUnassignTitle(instructorCount: number): string {
  return instructorCount > 1 ? '강사 일괄 배정 취소 안내' : '강사 배정 취소 안내'
}

/** 개인형 시안 03-1(4121:129121, 발송 전)·03-2(9899:176659, 발송 후) 제목 */
export function resolveIndividualScheduleUnassignTitle(scheduleCount: number): string {
  return scheduleCount > 1 ? '교육 일괄 배정 취소 안내' : '교육 배정 취소 안내'
}

/** 개인형 시안 03-1·03-2 본문 — `[일정] 교육일` / `[일정] 교육일 외 N개` */
export function buildIndividualScheduleUnassignMessage(
  scheduleLabels: string[],
  notificationSent: boolean
): string {
  const first = scheduleLabels[0]?.trim() || '교육 일정'
  const others = scheduleLabels.length - 1
  const subject = others > 0 ? `[**${first}**] 교육일 외 ${others}개` : `[**${first}**] 교육일`
  if (!notificationSent) {
    return `${subject}의 배정을 취소하시겠습니까?\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소됩니다.`
  }
  return `${subject}의 배정을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.`
}

export function SchoolDetailUnassignConfirmModal({
  open,
  onCancel,
  instructorNames,
  targetNames,
  onConfirm,
  variant = 'default',
  notificationSent,
  confirmLoading = false,
}: SchoolDetailUnassignConfirmModalProps) {
  if (variant === 'individual-schedule') {
    const sent = notificationSent !== false
    return (
      <PermissionModal
        open={open}
        variant="reject"
        className="school-detail-unassign-confirm-modal"
        title={resolveIndividualScheduleUnassignTitle(targetNames.length)}
        message={buildIndividualScheduleUnassignMessage(targetNames, sent)}
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

  if (variant === 'institution-detail') {
    const sent = notificationSent !== false
    return (
      <PermissionModal
        open={open}
        variant="reject"
        className="school-detail-unassign-confirm-modal"
        title={resolveInstitutionDetailUnassignTitle(instructorNames.length)}
        message={buildInstitutionDetailUnassignMessage(
          instructorNames,
          targetNames[0] ?? '',
          sent
        )}
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
      faultPartyRequired
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
