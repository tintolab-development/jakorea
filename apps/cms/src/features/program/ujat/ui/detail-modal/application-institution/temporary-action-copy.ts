export type UjatTemporaryAction =
  | 'temp_assign'
  | 'bulk_temp_assign'
  | 'temp_reject'
  | 'bulk_temp_reject'
  | 'temp_assign_cancel'
  | 'temp_reject_cancel'

export type UjatTemporaryActionKind =
  | 'temp_assign'
  | 'temp_reject'
  | 'temp_assign_cancel'
  | 'temp_reject_cancel'

export type UjatTemporaryActionCopy = {
  action: UjatTemporaryAction
  title: string
  lead: string
  leadSuffix: string
  note: string
  confirmLabel: string
  confirmTone: 'primary' | 'danger-outline'
}

function displayInstitutionName(names: readonly string[]) {
  return names[0]?.trim() || '기관'
}

export function resolveUjatTemporaryAction(
  kind: UjatTemporaryActionKind,
  institutionNames: readonly string[]
): UjatTemporaryAction {
  const bulk = institutionNames.filter(name => name.trim()).length > 1
  if (kind === 'temp_assign') return bulk ? 'bulk_temp_assign' : 'temp_assign'
  if (kind === 'temp_reject') return bulk ? 'bulk_temp_reject' : 'temp_reject'
  if (kind === 'temp_assign_cancel') return 'temp_assign_cancel'
  return 'temp_reject_cancel'
}

export function extraInstitutionCount(institutionNames: readonly string[]) {
  return Math.max(0, institutionNames.filter(name => name.trim()).length - 1)
}

export function buildUjatTemporaryActionCopy(
  kind: UjatTemporaryActionKind,
  institutionNames: readonly string[]
): UjatTemporaryActionCopy {
  const action = resolveUjatTemporaryAction(kind, institutionNames)
  const name = displayInstitutionName(institutionNames)
  const extra = extraInstitutionCount(institutionNames)

  if (action === 'temp_assign') {
    return {
      action,
      title: '임시 배정 안내',
      lead: `[${name}]`,
      leadSuffix: ' 기관을 임시 배정하시겠습니까?',
      note: '교육일 임시 배정을 위한 작업으로, 실제 승인 결과에는 반영되지 않습니다.',
      confirmLabel: '임시 배정',
      confirmTone: 'primary',
    }
  }

  if (action === 'bulk_temp_assign') {
    return {
      action,
      title: '일괄 임시 배정 안내',
      lead: `[${name}]`,
      leadSuffix: ` 외 ${extra}개의 기관을 임시 배정하시겠습니까?`,
      note: '교육일 임시 배정을 위한 작업으로, 실제 승인 결과에는 반영되지 않습니다.',
      confirmLabel: '임시 배정',
      confirmTone: 'primary',
    }
  }

  if (action === 'temp_reject') {
    return {
      action,
      title: '임시 반려 안내',
      lead: `[${name}]`,
      leadSuffix: ' 기관을 임시 반려하시겠습니까?',
      note: '실제 반려 결과에는 반영되지 않으며, 프로그램 신청 반려 시 별도 처리가 필요합니다.',
      confirmLabel: '임시 반려',
      confirmTone: 'primary',
    }
  }

  if (action === 'bulk_temp_reject') {
    return {
      action,
      title: '일괄 임시 반려 안내',
      lead: `[${name}]`,
      leadSuffix: ` 외 ${extra}개의 기관을 임시 반려하시겠습니까?`,
      note: '실제 반려 결과에는 반영되지 않으며, 프로그램 신청 반려 시 별도 처리가 필요합니다.',
      confirmLabel: '임시 반려',
      confirmTone: 'primary',
    }
  }

  if (action === 'temp_assign_cancel') {
    return {
      action,
      title: '임시 배정 취소 안내',
      lead: `[${name}]`,
      leadSuffix:
        extra > 0
          ? ` 외 ${extra}개의 기관의 임시 배정을 취소하시겠습니까?`
          : '의 임시 배정을 취소하시겠습니까?',
      note: '취소 시 평가 대기 상태로 돌아가며, 실제 승인·반려 결과에는 반영되지 않습니다.',
      confirmLabel: '임시 배정 취소',
      confirmTone: 'danger-outline',
    }
  }

  return {
    action,
    title: '임시 반려 취소 안내',
    lead: `[${name}]`,
    leadSuffix:
      extra > 0
        ? ` 외 ${extra}개의 기관의 임시 반려를 취소하시겠습니까?`
        : '의 임시 반려를 취소하시겠습니까?',
    note: '취소 시 평가 대기 상태로 돌아가며, 실제 승인·반려 결과에는 반영되지 않습니다.',
    confirmLabel: '임시 반려 취소',
    confirmTone: 'danger-outline',
  }
}
