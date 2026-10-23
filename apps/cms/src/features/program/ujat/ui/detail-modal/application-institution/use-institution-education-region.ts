import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UJAT_INSTITUTION_EDUCATION_REGION_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import type { UjatInstitutionApplicationRegionKey } from './list/regions'
import {
  applyUjatInstitutionEducationRegionParam,
  resolveUjatInstitutionEducationRegionKey,
} from './list/region-query'

export function useUjatInstitutionEducationRegion() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeRegion = resolveUjatInstitutionEducationRegionKey(searchParams)
  const educationRegionCode = toUjatEducationRegionCode(activeRegion)

  const setActiveRegion = useCallback(
    (regionKey: UjatInstitutionApplicationRegionKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          applyUjatInstitutionEducationRegionParam(next, regionKey)
          return next.toString() === prev.toString() ? prev : next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  useEffect(() => {
    if (searchParams.get(UJAT_INSTITUTION_EDUCATION_REGION_PARAM)) return
    setActiveRegion(activeRegion)
  }, [activeRegion, searchParams, setActiveRegion])

  return {
    activeRegion,
    educationRegionCode,
    setActiveRegion,
    regionParam: UJAT_INSTITUTION_EDUCATION_REGION_PARAM,
  }
}
