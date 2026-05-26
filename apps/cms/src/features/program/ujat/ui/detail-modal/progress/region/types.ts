import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

export type RegionAssignmentClassSlot = {
  id: string
  classLabel: string
}

export type RegionAssignmentColumn = {
  id: string
  dateLabel: string
  institutionName: string
  /** 구/군 또는 시(경기 남부는 시 단위만) */
  location: string
  /** 해당 일정·기관에 배정 가능한 학급 목록 */
  classSlots: RegionAssignmentClassSlot[]
  /** 배정 불가일 — 기존 배정 학급은 빨간 텍스트, 빈 칸은 연한 빨간 배경 */
  isBlockedDate?: boolean
}

export type RegionAssignmentCell =
  | { kind: 'empty'; blockedEmpty?: boolean }
  | {
      kind: 'assigned'
      classLabel: string
      isAttendanceManager?: boolean
      isSolo?: boolean
      /** 배정 불가일·활동 포기 등으로 재배정 전까지 빨간 표기 */
      isInvalidAssignment?: boolean
    }

export type RegionAssignmentVolunteerRow = {
  id: string
  name: string
  totalAssignedDays: number
  /** 활동 포기자 — 이름 셀 빨간 배경 */
  isWithdrawnVolunteer?: boolean
  /**
   * 활동 포기일 이후 열 인덱스(0-based, date columns 기준).
   * 해당 인덱스부터는 미배정(-) 처리.
   */
  withdrawnFromColumnIndex?: number
  cells: RegionAssignmentCell[]
}

export type RegionAssignmentTableData = {
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  volunteerCount: number
  columns: RegionAssignmentColumn[]
  rows: RegionAssignmentVolunteerRow[]
}
