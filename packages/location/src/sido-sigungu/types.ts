export type SigunguType = '시' | '군' | '구'

export interface Sigungu {
  name: string
  type: SigunguType
}

export interface SidoCategory {
  name: string
  sigungu: Sigungu[]
}

export type RegionSelectOption = {
  label: string
  value: string
}
