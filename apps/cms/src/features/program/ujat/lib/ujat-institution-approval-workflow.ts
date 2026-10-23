/**
 * UJAT 기관 신청 승인 순서.
 * 임시 일정 배정 → 기관 확인 → 관리자 최종 승인.
 * applicationStatus만으로 최종 승인 가능 여부를 판단하지 않는다.
 *
 * 기관 확인이 끝나면 assignmentLockedAt이 저장되고 일정 수정이 잠긴다.
 * 그 잠금은 일정 수정 버튼만 막고, 최종 승인은 TEMP_ASSIGNED + CONFIRMED일 때 허용한다.
 */

export const UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE =
  '먼저 임시 일정을 배정하고 기관 확인을 완료해 주세요.'

export const UJAT_REVISION_REQUEST_PENDING_REASON =
  '이미 수정 요청됨. 교사 재제출 대기 중입니다.'

export const UJAT_REVISION_REQUEST_CHECKING_BLOCKED_REASON =
  '기관 확인이 완료되기 전에는 수정 요청을 보낼 수 없습니다.'

export const UJAT_REVISION_REQUEST_DUPLICATE_MESSAGE =
  '이미 수정 요청된 기관입니다. 교사 재제출 후 다시 시도해 주세요.'

export type UjatInstitutionWorkflowInput = {
  applicationStatus?: string | null
  temporaryAssignmentStatus?: string | null
  institutionConfirmationStatus?: string | null
  assignmentLockedAt?: string | null
  portalBannerState?: string | null
}

export type UjatInstitutionWorkflowPrimaryAction = 'open_schedule_assign' | 'final_approve' | 'none'

export type UjatInstitutionWorkflowView = {
  displayLabel: string
  primaryLabel: string
  primaryAction: UjatInstitutionWorkflowPrimaryAction
  primaryDisabled: boolean
  canFinalApprove: boolean
  scheduleEditDisabled: boolean
  revisionRequestDisabled: boolean
  revisionRequestDisabledReason?: string
}

function wire(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_')
}

function isTempAssigned(status: string): boolean {
  return ['TEMP_ASSIGNED', 'TEMPORARY_ASSIGNED', 'TEMPORARY', 'TEMP_ASSIGNMENT_CONFIRMED'].includes(
    status
  )
}

function isTempRejected(status: string): boolean {
  return ['TEMP_REJECTED', 'TEMPORARY_REJECTED'].includes(status)
}

function isTerminalReject(status: string): boolean {
  return ['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(status)
}

function isConfirmed(status: string): boolean {
  return status === 'CONFIRMED' || status === 'INSTITUTION_CONFIRMED'
}

function isRevisionRequested(status: string): boolean {
  return status === 'REVISION_REQUESTED'
}

function isInstitutionChecking(status: string): boolean {
  return status === 'CHECKING'
}

function resolveRevisionRequestGate(
  applicationStatus: string,
  institutionConfirmationStatus: string
): { disabled: boolean; reason?: string } {
  if (applicationStatus === 'APPROVED' || isTerminalReject(applicationStatus)) {
    return { disabled: true }
  }
  if (isRevisionRequested(institutionConfirmationStatus)) {
    return { disabled: true, reason: UJAT_REVISION_REQUEST_PENDING_REASON }
  }
  if (isInstitutionChecking(institutionConfirmationStatus)) {
    return { disabled: true, reason: UJAT_REVISION_REQUEST_CHECKING_BLOCKED_REASON }
  }
  return { disabled: false }
}

function withRevisionRequestGate(
  view: UjatInstitutionWorkflowView,
  gate: { disabled: boolean; reason?: string }
): UjatInstitutionWorkflowView {
  if (!gate.disabled) return view
  return {
    ...view,
    revisionRequestDisabled: true,
    revisionRequestDisabledReason: gate.reason,
  }
}

export function resolveUjatInstitutionWorkflow(
  input: UjatInstitutionWorkflowInput
): UjatInstitutionWorkflowView {
  const applicationStatus = wire(input.applicationStatus)
  const temporaryAssignmentStatus = wire(input.temporaryAssignmentStatus)
  const institutionConfirmationStatus = wire(input.institutionConfirmationStatus)
  const scheduleEditDisabled =
    Boolean(input.assignmentLockedAt?.trim()) || applicationStatus === 'APPROVED'
  const revisionRequestGate = resolveRevisionRequestGate(
    applicationStatus,
    institutionConfirmationStatus
  )

  if (applicationStatus === 'APPROVED') {
    return withRevisionRequestGate(
      {
        displayLabel: '최종 승인',
        primaryLabel: '최종 승인',
        primaryAction: 'none',
        primaryDisabled: true,
        canFinalApprove: false,
        scheduleEditDisabled: true,
        revisionRequestDisabled: true,
      },
      revisionRequestGate
    )
  }

  if (isTerminalReject(applicationStatus)) {
    return withRevisionRequestGate(
      {
        displayLabel: '신청 반려',
        primaryLabel: '최종 승인',
        primaryAction: 'none',
        primaryDisabled: true,
        canFinalApprove: false,
        scheduleEditDisabled,
        revisionRequestDisabled: revisionRequestGate.disabled,
      },
      revisionRequestGate
    )
  }

  if (isTempRejected(temporaryAssignmentStatus) || isTempRejected(applicationStatus)) {
    return withRevisionRequestGate(
      {
        displayLabel: '임시 배정 반려',
        primaryLabel: '임시 배정 반려',
        primaryAction: 'none',
        primaryDisabled: true,
        canFinalApprove: false,
        scheduleEditDisabled,
        revisionRequestDisabled: revisionRequestGate.disabled,
      },
      revisionRequestGate
    )
  }

  if (isTempAssigned(temporaryAssignmentStatus)) {
    if (isConfirmed(institutionConfirmationStatus)) {
      return withRevisionRequestGate(
        {
          displayLabel: '기관 확인 완료',
          primaryLabel: '최종 승인',
          primaryAction: 'final_approve',
          primaryDisabled: false,
          canFinalApprove: true,
          scheduleEditDisabled,
          revisionRequestDisabled: revisionRequestGate.disabled,
        },
        revisionRequestGate
      )
    }
    if (isRevisionRequested(institutionConfirmationStatus)) {
      return withRevisionRequestGate(
        {
          displayLabel: '일정 수정 필요',
          primaryLabel: scheduleEditDisabled ? '일정 잠금' : '일정 재배정',
          primaryAction: scheduleEditDisabled ? 'none' : 'open_schedule_assign',
          primaryDisabled: scheduleEditDisabled,
          canFinalApprove: false,
          scheduleEditDisabled,
          revisionRequestDisabled: revisionRequestGate.disabled,
        },
        revisionRequestGate
      )
    }
    return withRevisionRequestGate(
      {
        displayLabel: '기관 확인 대기',
        primaryLabel: '기관 확인 대기',
        primaryAction: 'none',
        primaryDisabled: true,
        canFinalApprove: false,
        scheduleEditDisabled,
        revisionRequestDisabled: revisionRequestGate.disabled,
      },
      revisionRequestGate
    )
  }

  return withRevisionRequestGate(
    {
      displayLabel: '일정 배정 필요',
      primaryLabel: '임시 일정 배정',
      primaryAction: 'open_schedule_assign',
      primaryDisabled: false,
      canFinalApprove: false,
      scheduleEditDisabled,
      revisionRequestDisabled: revisionRequestGate.disabled,
    },
    revisionRequestGate
  )
}

export function readUjatInstitutionWorkflowInput(
  detail: object | null | undefined,
  schedule: object | null | undefined
): UjatInstitutionWorkflowInput {
  return {
    applicationStatus: readWorkflowString(detail, schedule, 'applicationStatus'),
    temporaryAssignmentStatus: readWorkflowString(detail, schedule, 'temporaryAssignmentStatus'),
    institutionConfirmationStatus: readWorkflowString(
      detail,
      schedule,
      'institutionConfirmationStatus'
    ),
    assignmentLockedAt: readWorkflowString(detail, schedule, 'assignmentLockedAt'),
    portalBannerState: readWorkflowString(detail, schedule, 'portalBannerState'),
  }
}

function readWorkflowString(
  detail: object | null | undefined,
  schedule: object | null | undefined,
  key: string
): string | null {
  const fromDetail = readOwnString(detail, key)
  if (fromDetail.present) return fromDetail.value
  const fromSchedule = readOwnString(schedule, key)
  if (fromSchedule.present) return fromSchedule.value
  return null
}

function readOwnString(
  source: object | null | undefined,
  key: string
): { present: boolean; value: string | null } {
  if (!source || !Object.prototype.hasOwnProperty.call(source, key)) {
    return { present: false, value: null }
  }
  const value = (source as Record<string, unknown>)[key]
  if (typeof value === 'string') return { present: true, value }
  if (value == null) return { present: true, value: null }
  return { present: true, value: null }
}
