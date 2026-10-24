/**
 * UJAT 기관 신청 — 타입·빈 stub (FE Mock 시드 제거)
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationDetail } from '@/features/program/ujat/ui/detail-modal/application-institution/detail/detail-types'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionTempAssignmentStatus,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatScheduleConfirmConfirmedDetailExtras } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/confirmed-detail-types'
import type { UjatInstitutionScheduleConfirmStatus } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/types'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'

/** 임시 배정 store 초기 시드 — `schedule-assign/store.ts`에서 1회 적용 */
export type UjatInstitutionScheduleAssignSeedEntry = {
  institutionId: string
  isoDate: string
  gradeValues: string[]
}

export type UjatInstitutionScheduleAssignRegionSeed = {
  maxClassesPerDay?: string
  assignments: UjatInstitutionScheduleAssignSeedEntry[]
}

/** Mock 시드 제거 — 빈 시드 */
export const UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED: Partial<
  Record<UjatInstitutionApplicationRegionKey, UjatInstitutionScheduleAssignRegionSeed>
> = {}

export function getUjatInstitutionScheduleAssignSeed(): Partial<
  Record<UjatInstitutionApplicationRegionKey, UjatInstitutionScheduleAssignRegionSeed>
> {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED
}

export function getUjatInstitutionApplicationRowById(
  _institutionId: string
): UjatInstitutionApplicationRow | null {
  return null
}

export function patchUjatInstitutionApplicationRows(
  _ids: string[],
  _status: UjatInstitutionTempAssignmentStatus
): void {}

export function patchUjatInstitutionScheduleConfirmStatus(
  _ids: string[],
  _status: UjatInstitutionScheduleConfirmStatus
): void {}

export function getUjatInstitutionScheduleConfirmConfirmedDetailExtras(
  _institutionId: string
): UjatScheduleConfirmConfirmedDetailExtras | undefined {
  return undefined
}

export function getUjatInstitutionApplicationDetail(
  row: UjatInstitutionApplicationRow
): UjatInstitutionApplicationDetail {
  const regionLabel = row.regionKey
    ? getUjatEducationRegionLabel(row.regionKey, '-')
    : '-'
  return {
    institutionName: row.institutionName,
    regionLabel,
    tempAssignmentStatus: row.tempAssignmentStatus,
    preferredEducationDates: [],
    address: '-',
    addressDetail: '-',
    teacherContact: {
      teacherName: row.teacherName,
      tel: '-',
      mobile: '-',
      email: '-',
    },
    otherRequests: '-',
    gradeBlocks: [],
    classTimeRows: [],
  }
}
