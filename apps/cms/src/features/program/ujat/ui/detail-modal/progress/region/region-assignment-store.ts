import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { buildInitialRegionAssignmentTableData } from './mock-data'
import type { RegionAssignmentTableData } from './types'

const regionAssignmentState = new Map<
  UjatInstitutionApplicationRegionKey,
  RegionAssignmentTableData
>()

function ensureRegionAssignmentState(
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  let state = regionAssignmentState.get(regionKey)
  if (!state) {
    state = buildInitialRegionAssignmentTableData(regionKey)
    regionAssignmentState.set(regionKey, state)
  }
  return state
}

export function getRegionAssignmentTableDataFromStore(
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  return ensureRegionAssignmentState(regionKey)
}

export function setRegionAssignmentTableData(
  regionKey: UjatInstitutionApplicationRegionKey,
  data: RegionAssignmentTableData
): void {
  regionAssignmentState.set(regionKey, data)
}

export function resetRegionAssignmentStore(
  regionKey?: UjatInstitutionApplicationRegionKey
): void {
  if (regionKey) {
    regionAssignmentState.delete(regionKey)
    return
  }
  regionAssignmentState.clear()
}
