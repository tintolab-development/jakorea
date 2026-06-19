export type UjatRegionCapacityRegionName = string

export type UjatRegionCapacityField = 'classCount' | 'volunteerCount'

export type UjatRegionCapacityRegionValues = Partial<
  Record<UjatRegionCapacityField, string>
>

export type UjatRegionCapacitySemesterValues = Partial<
  Record<UjatRegionCapacityRegionName, UjatRegionCapacityRegionValues>
>

export type UjatRegionCapacityBySemesterState = {
  h1: UjatRegionCapacitySemesterValues
  h2: UjatRegionCapacitySemesterValues
}

export const UJAT_REGION_CAPACITY_OVERLAY_KEY = 'ujat.capacity.byRegion' as const

export const UJAT_REGION_CAPACITY_SEMESTER_LABEL = {
  h1: '■ 상반기 (1학기)',
  h2: '■ 하반기 (2학기)',
} as const

export type UjatRegionCapacitySemesterKey = keyof typeof UJAT_REGION_CAPACITY_SEMESTER_LABEL

export const EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER: UjatRegionCapacityBySemesterState = {
  h1: {},
  h2: {},
}
