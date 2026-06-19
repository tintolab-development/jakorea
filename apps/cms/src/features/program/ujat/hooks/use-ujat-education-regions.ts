import { useEffect, useMemo, useState } from 'react'
import { UJAT_EDUCATION_REGIONS_CHANGED_EVENT } from '@/features/program/ujat/lib/education-region-store'
import {
  getUjatEducationRegionSortOrderMap,
  getUjatVolunteerPreferredRegionLabels,
  listUjatEducationRegionsActive,
  type UjatEducationRegionOption,
} from '@/features/program/ujat/lib/ujat-education-regions'

export function useUjatEducationRegions(): {
  regions: UjatEducationRegionOption[]
  labels: string[]
  sortOrderMap: Record<string, number>
} {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const handler = () => setVersion(current => current + 1)
    window.addEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
  }, [])

  const regions = useMemo(() => listUjatEducationRegionsActive(), [version])
  const labels = useMemo(() => getUjatVolunteerPreferredRegionLabels(), [version])
  const sortOrderMap = useMemo(() => getUjatEducationRegionSortOrderMap(), [version])

  return { regions, labels, sortOrderMap }
}
