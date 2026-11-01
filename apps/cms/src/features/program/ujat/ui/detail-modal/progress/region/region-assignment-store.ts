import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import type { RegionAssignmentTableData } from './types'

type RegionAssignmentStoreKey = `${EducationProgressHalfKey}:${UjatInstitutionApplicationRegionKey}`

function toStoreKey(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentStoreKey {
  return `${half}:${regionKey}`
}

function buildInitialRegionAssignmentTableData(
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return {
    regionKey,
    regionLabel: getUjatEducationRegionLabel(regionKey, regionKey),
    volunteerCount: 0,
    columns: [],
    rows: [],
  }
}

const regionAssignmentState = new Map<RegionAssignmentStoreKey, RegionAssignmentTableData>()

function ensureRegionAssignmentState(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  const key = toStoreKey(half, regionKey)
  let state = regionAssignmentState.get(key)
  if (!state) {
    state = buildInitialRegionAssignmentTableData(regionKey)
    regionAssignmentState.set(key, state)
  }
  return state
}

export function getRegionAssignmentTableDataFromStore(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return ensureRegionAssignmentState(half, regionKey)
}

export function setRegionAssignmentTableData(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey,
  data: RegionAssignmentTableData
): void {
  regionAssignmentState.set(toStoreKey(half, regionKey), data)
}

export function resetRegionAssignmentStore(
  half?: EducationProgressHalfKey,
  regionKey?: UjatInstitutionApplicationRegionKey
): void {
  if (half && regionKey) {
    regionAssignmentState.delete(toStoreKey(half, regionKey))
    return
  }
  if (half) {
    for (const key of regionAssignmentState.keys()) {
      if (key.startsWith(`${half}:`)) regionAssignmentState.delete(key)
    }
    return
  }
  regionAssignmentState.clear()
}
