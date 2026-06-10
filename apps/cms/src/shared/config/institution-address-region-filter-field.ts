/**
 * 기관 소재지·자택 주소지 `addressRegion` 필터 공통 정의
 *
 * 하위 시/도·시/군/구: 각 114.75px, 사이 gap 6px, 열 전체 235.5px
 * @see apps/cms/.cursor/rules/design/filter-area-layout.mdc
 */

import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_ADDRESS_REGION_FIELD_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  INSTITUTION_SIDO_FILTER_OPTIONS,
  getInstitutionSigunguSelectOptions,
} from './institution-address-region-data'

export type CreateAddressRegionFilterFieldArgs = {
  key?: string
  label?: string
  sidoKey?: string
  sigunguKey?: string
  allowClear?: boolean
  /** 기본 `FILTER_ADDRESS_REGION_FIELD_WIDTH_PX` (235.5) */
  width?: number
}

/** 기관 소재지 — 시/도·시/군/구 이중 셀렉트 */
export function createInstitutionAddressRegionFilterField(
  args: CreateAddressRegionFilterFieldArgs = {}
): FilterFieldConfig {
  return {
    key: args.key ?? 'institutionAddress',
    type: 'addressRegion',
    label: args.label ?? '기관 소재지',
    allowClear: args.allowClear,
    width: args.width ?? FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
    addressRegion: {
      sidoKey: args.sidoKey ?? 'institutionSido',
      sigunguKey: args.sigunguKey ?? 'institutionSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  }
}

/** 자택 주소지/소재지 — 동일 치수·다른 state 키 */
export function createHomeAddressRegionFilterField(
  args: CreateAddressRegionFilterFieldArgs = {}
): FilterFieldConfig {
  return createInstitutionAddressRegionFilterField({
    ...args,
    key: args.key ?? 'homeAddress',
    label: args.label ?? '자택 주소지',
    sidoKey: args.sidoKey ?? 'homeSido',
    sigunguKey: args.sigunguKey ?? 'homeSigungu',
  })
}
