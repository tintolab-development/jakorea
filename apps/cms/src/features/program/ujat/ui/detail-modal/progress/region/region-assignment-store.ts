import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import type { RegionAssignmentTableData } from './types'

type RegionAssignmentStoreKey =
  `${string}:${EducationProgressHalfKey}:${UjatInstitutionApplicationRegionKey}`

function toStoreKey(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentStoreKey {
  return `${programId}:${half}:${regionKey}`
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
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  const key = toStoreKey(programId, half, regionKey)
  let state = regionAssignmentState.get(key)
  if (!state) {
    state = buildInitialRegionAssignmentTableData(regionKey)
    regionAssignmentState.set(key, state)
  }
  return state
}

export function getRegionAssignmentTableDataFromStore(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return ensureRegionAssignmentState(programId, half, regionKey)
}

export function setRegionAssignmentTableData(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey,
  data: RegionAssignmentTableData
): void {
  regionAssignmentState.set(toStoreKey(programId, half, regionKey), data)
}

export function resetRegionAssignmentStore(
  programId?: string,
  half?: EducationProgressHalfKey,
  regionKey?: UjatInstitutionApplicationRegionKey
): void {
  if (programId && half && regionKey) {
    regionAssignmentState.delete(toStoreKey(programId, half, regionKey))
    return
  }
  if (programId && half) {
    const prefix = `${programId}:${half}:`
    for (const key of regionAssignmentState.keys()) {
      if (key.startsWith(prefix)) regionAssignmentState.delete(key)
    }
    return
  }
  if (programId) {
    const prefix = `${programId}:`
    for (const key of regionAssignmentState.keys()) {
      if (key.startsWith(prefix)) regionAssignmentState.delete(key)
    }
    return
  }
  regionAssignmentState.clear()
}
