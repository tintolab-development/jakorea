/**
 * 실적 관리 목록 필터 필드 정의 (TableFilterGroup용)
 * - 년도/분기는 한 항목(`selectPair` compact)으로 묶어 레이블 1개 + 셀렉트 2개로 렌더
 *   기관 소재지와 동일: 열 235.5px · 하위 50:50(각 114.75px) · gap 6px
 * - 기관 소재지(시/도·시/군/구)도 한 항목(`addressRegion`)으로 묶음
 * - 단일 검색: 공통 240px 규격 — `flex: 1 1 0` 금지(Col만 늘고 컨트롤 240px 고정 시 갭 과다)
 */

import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
  FILTER_CONTROL_MAX_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { MOCK_SIDO_SIGUNGU } from '@jakorea/location/sido-sigungu'
import {
  EDUCATION_RECORD_BUSINESS_AREAS,
  EDUCATION_RECORD_EDUCATION_TYPE_OPTIONS,
  EDUCATION_RECORD_IPS_VALUES,
} from '../lib/education-record-labels'

const QUARTER_OPTIONS: Array<{ label: string; value: string | number }> = [
  { label: '1분기', value: 1 },
  { label: '2분기', value: 2 },
  { label: '3분기', value: 3 },
  { label: '4분기', value: 4 },
]

const SIDO_OPTIONS = MOCK_SIDO_SIGUNGU.map(sido => ({
  label: sido.name,
  value: sido.name,
}))

/** 선택된 시/도에 속한 시/군/구 옵션을 반환. 시/도 미선택 시 전체 시/군/구 노출. */
function getSigunguOptionsBySido(
  sido: string | undefined | null
): Array<{ label: string; value: string }> {
  if (sido && sido.trim().length > 0) {
    const selected = MOCK_SIDO_SIGUNGU.find(s => s.name === sido)
    if (!selected) return []
    return selected.sigungu.map(sg => ({
      label: `${selected.name} ${sg.name}`,
      value: sg.name,
    }))
  }

  return MOCK_SIDO_SIGUNGU.flatMap(s =>
    s.sigungu.map(sg => ({
      label: `${s.name} ${sg.name}`,
      value: sg.name,
    }))
  )
}

export type CreateEducationRecordFilterFieldsArgs = {
  /** 연도 셀렉트 옵션 (내림차순) */
  availableYears: number[]
}

/**
 * 필터 필드 배열을 생성한다. 시/군/구 옵션은 `addressRegion.getSigunguOptions`가
 * 현재 시/도 값을 인자로 호출하므로 별도 의존성 없이 한 번만 만들면 된다.
 */
export function createEducationRecordFilterFields({
  availableYears,
}: CreateEducationRecordFilterFieldsArgs): FilterFieldConfig[] {
  const yearOptions: Array<{ label: string; value: string | number }> = availableYears.map(y => ({
    label: `${y}년`,
    value: String(y),
  }))

  return [
    {
      key: 'yearQuarter',
      type: 'selectPair',
      label: '년도/분기',
      allowClear: true,
      width: FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
      selectPair: {
        compact: true,
        primary: {
          key: 'year',
          options: yearOptions,
          placeholder: '년도',
          allowClear: true,
        },
        secondary: {
          key: 'quarter',
          options: QUARTER_OPTIONS,
          placeholder: '분기',
          allowClear: true,
        },
      },
    },
    {
      key: 'businessArea',
      type: 'select',
      label: '사업 분야',
      placeholder: '사업 분야',
      allowClear: true,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: EDUCATION_RECORD_BUSINESS_AREAS.map(area => ({ label: area, value: area })),
    },
    {
      key: 'sponsorName',
      type: 'search',
      label: '후원사명(국문)',
      placeholder: '후원사명을 입력하세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'mainTitle',
      type: 'search',
      label: '대표 프로그램명(국문)',
      placeholder: '대표 프로그램명을 입력하세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'title',
      type: 'search',
      label: '세부 프로그램명(국문)',
      placeholder: '세부 프로그램명을 입력하세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'textbookName',
      type: 'search',
      label: '교재명(국문)',
      placeholder: '교재명을 입력하세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'institutionName',
      type: 'search',
      label: '기관명',
      placeholder: '기관명을 입력하세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'institutionRegion',
      type: 'addressRegion',
      label: '기관 소재지',
      allowClear: true,
      width: FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
      addressRegion: {
        sidoKey: 'sido',
        sigunguKey: 'sigungu',
        sidoOptions: SIDO_OPTIONS,
        getSigunguOptions: getSigunguOptionsBySido,
        sidoPlaceholder: '시/도',
        sigunguPlaceholder: '시/군/구',
      },
    },
    {
      key: 'ips',
      type: 'select',
      label: 'IPS',
      placeholder: 'IPS',
      allowClear: true,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: EDUCATION_RECORD_IPS_VALUES.map(value => ({ label: value, value })),
    },
    {
      key: 'educationType',
      type: 'select',
      label: '교육 형태',
      placeholder: '교육 형태',
      allowClear: true,
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: EDUCATION_RECORD_EDUCATION_TYPE_OPTIONS,
    },
  ]
}
