import { useEffect, useMemo, useState } from 'react'
import { shouldUseUjatEducationRegionsRemoteApi } from '@/features/program/ujat/api/education-regions/capabilities'
import { useUjatEducationRegionsList } from '@/features/program/ujat/api/education-regions/hooks'
import { UJAT_EDUCATION_REGIONS_CHANGED_EVENT } from '@/features/program/ujat/lib/education-region-store'
import {
  listUjatEducationRegionsActive,
  type UjatEducationRegionOption,
} from '@/features/program/ujat/lib/ujat-education-regions'

export function useUjatEducationRegions(): {
  regions: UjatEducationRegionOption[]
  labels: string[]
  sortOrderMap: Record<string, number>
} {
  const remoteEnabled = shouldUseUjatEducationRegionsRemoteApi()
  const listQuery = useUjatEducationRegionsList(remoteEnabled)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (remoteEnabled) return
    const handler = () => setVersion(current => current + 1)
    window.addEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
  }, [remoteEnabled])

  const regions = useMemo(() => {
    if (remoteEnabled && listQuery.data) {
      return listQuery.data
        .filter(row => row.active)
        .map(row => ({ key: row.regionKey, label: row.name }))
    }
    void version
    return listUjatEducationRegionsActive()
  }, [listQuery.data, remoteEnabled, version])

  const labels = useMemo(() => regions.map(row => row.label), [regions])
  const sortOrderMap = useMemo(() => {
    const map: Record<string, number> = {}
    regions.forEach((row, index) => {
      map[row.key] = index
      map[row.label] = index
    })
    return map
  }, [regions])

  return { regions, labels, sortOrderMap }
}
