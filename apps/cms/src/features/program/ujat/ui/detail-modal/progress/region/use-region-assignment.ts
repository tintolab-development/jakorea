import { useCallback, useMemo, useState } from 'react'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { autoAssignRegionEducationDays } from './auto-assign'
import {
  getRegionAssignmentTableDataFromStore,
  setRegionAssignmentTableData,
} from './region-assignment-store'

export function useRegionAssignment(regionKey: UjatInstitutionApplicationRegionKey) {
  const [version, setVersion] = useState(0)

  const tableData = useMemo(() => {
    void version
    return getRegionAssignmentTableDataFromStore(regionKey)
  }, [regionKey, version])

  const bump = useCallback(() => setVersion(v => v + 1), [])

  const runAutoAssign = useCallback(() => {
    const current = getRegionAssignmentTableDataFromStore(regionKey)
    const next = autoAssignRegionEducationDays(current)
    setRegionAssignmentTableData(regionKey, next)
    bump()
    return next
  }, [bump, regionKey])

  return {
    tableData,
    tableVersion: version,
    runAutoAssign,
    bump,
  }
}
