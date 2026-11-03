import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

export type RegionAssignmentClassSlot = {
  /** educationSlotId (직접 배정 API path param) */
  id: string
  classLabel: string
}

export type RegionAssignmentColumn = {
  /** allocation-matrix columnKey */
  id: string
  scheduleId?: string
  organizationApplicationId?: string
  dateLabel: string
  /** YYYY-MM-DD — 출석·필터용 */
  isoDate?: string
  institutionName: string
  /** 구/군 또는 시(경기 남부는 시 단위만) */
  location: string
  /** 해당 일정·기관에 배정 가능한 학급 목록 — org temporary slots / cell educationSlotId만 (invent 금지) */
  classSlots: RegionAssignmentClassSlot[]
}

export type RegionAssignmentCell =
  | {
      kind: 'empty'
      /** 참여 불가일(unavailability) — 연한 빨간 배경. 대체자 없으면 `-` */
      blockedEmpty?: boolean
      /** 참여 불가일 대체 봉사자 이름 — BE unavailability `replacementParticipantId` 기준 */
      substituteName?: string
    }
  | {
      kind: 'assigned'
      classLabel: string
      isAttendanceManager?: boolean
      isSolo?: boolean
      /** 참여 불가·활동 포기 등으로 재배정 전까지 빨간 표기 (`needsReassignment`) */
      isInvalidAssignment?: boolean
      /** allocation-matrix cell.assignmentStatus. 출결 담당 후보는 ASSIGNED만 */
      assignmentStatus?: string
    }

export type RegionAssignmentVolunteerRow = {
  id: string
  name: string
  totalAssignedDays: number
  /** 활동 포기자 — 행 연한 빨간 배경 (`giveUp`) */
  isWithdrawnVolunteer?: boolean
  cells: RegionAssignmentCell[]
}

export type RegionAssignmentTableData = {
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  volunteerCount: number
  columns: RegionAssignmentColumn[]
  rows: RegionAssignmentVolunteerRow[]
}
