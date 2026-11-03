import {
  isVolunteerAssignmentClassWithdrawn,
  type UjatVolunteerAssignmentProgressRow,
} from './assignment-types'
import { resolveVolunteerAssignmentAssignModalMode } from './volunteer-assign-modal-data'

export type VolunteerAssignGateResult =
  | { ok: true; row: UjatVolunteerAssignmentProgressRow }
  | {
      ok: false
      title: string
      content: string
    }

const BLOCKED_TITLE = '배정 불가 안내'

export const NO_VACANT_CLASS_OPTIONS_ALERT = {
  title: BLOCKED_TITLE,
  content:
    '배정 가능한 미배정 학급이 없습니다.\n기관 임시일정의 학급 슬롯을 확인해 주세요.',
} as const

export const PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT = {
  title: BLOCKED_TITLE,
  content:
    '학급 슬롯이 없는 파트너 배정입니다.\n교육 배정은 배정 취소 후 다시 진행해 주세요.',
} as const

export const MISSING_SCHEDULE_ASSIGN_ALERT = {
  title: '안내',
  content: '일정 정보를 확인할 수 없어 배정할 수 없습니다.',
} as const

/** 학급·파트너명이 모두 확정되면 재배정 전 취소가 필요하다 */
export function isVolunteerScheduleFullyAssigned(
  row: UjatVolunteerAssignmentProgressRow
): boolean {
  return row.classDisplay.kind === 'class' && row.partner.kind === 'name'
}

export function resolveVolunteerAssignGate(input: {
  selectedRowKeys: ReadonlyArray<string | number>
  rows: readonly UjatVolunteerAssignmentProgressRow[]
  /** 교육 배정 모드일 때 미배정 학급 옵션 수. 없으면 학급 검사를 건너뛴다. */
  vacantClassOptionCount?: number
}): VolunteerAssignGateResult {
  if (input.selectedRowKeys.length !== 1) {
    return {
      ok: false,
      title: BLOCKED_TITLE,
      content:
        '파트너 및 교육 배정은 한 건씩 가능합니다.\n배정할 일정을 하나만 선택해 주세요',
    }
  }

  const rowId = String(input.selectedRowKeys[0])
  const row = input.rows.find(item => item.id === rowId)
  if (!row) {
    return {
      ok: false,
      title: '안내',
      content: '선택한 교육 일정을 찾을 수 없습니다.',
    }
  }

  if (isVolunteerAssignmentClassWithdrawn(row) || row.isWithdrawn) {
    return {
      ok: false,
      title: '안내',
      content: '활동 포기된 일정에는 배정할 수 없습니다.',
    }
  }

  if (row.scheduleId == null) {
    return {
      ok: false,
      title: MISSING_SCHEDULE_ASSIGN_ALERT.title,
      content: MISSING_SCHEDULE_ASSIGN_ALERT.content,
    }
  }

  if (isVolunteerScheduleFullyAssigned(row)) {
    return {
      ok: false,
      title: BLOCKED_TITLE,
      content:
        '이미 배정 완료된 일정입니다.\n배정을 변경하려면 배정 취소 후 다시 배정해 주세요.',
    }
  }

  const modalMode = resolveVolunteerAssignmentAssignModalMode(row)
  if (
    modalMode === 'education' &&
    row.partner.kind === 'name' &&
    (row.educationSlotId == null || row.classDisplay.kind !== 'class')
  ) {
    return {
      ok: false,
      title: PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT.title,
      content: PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT.content,
    }
  }

  if (modalMode === 'education' && input.vacantClassOptionCount === 0) {
    return {
      ok: false,
      title: NO_VACANT_CLASS_OPTIONS_ALERT.title,
      content: NO_VACANT_CLASS_OPTIONS_ALERT.content,
    }
  }

  return { ok: true, row }
}
