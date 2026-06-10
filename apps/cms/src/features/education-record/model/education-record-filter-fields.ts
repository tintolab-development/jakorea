/**
 * 실적 관리 목록 필터 필드 정의 (TableFilterGroup용)
 * - 년도/분기는 한 항목(`selectPair`)으로 묶어 레이블 1개 + 셀렉트 2개로 렌더
 * - 기관 소재지(시/도·시/군/구)도 한 항목(`addressRegion`)으로 묶음
 * - pair 필드는 고정 px(`width`), 검색 필드는 공통 260px 고정
 */

import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { MOCK_SIDO_SIGUNGU } from '@/shared/constants/sido-sigungu'

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
      width: 224,
      selectPair: {
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
      key: 'institutionRegion',
      type: 'addressRegion',
      label: '기관 소재지',
      allowClear: true,
      width: 252,
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
      key: 'sponsorName',
      type: 'search',
      label: '후원사명',
      placeholder: '후원사명을 입력하세요',
    },
    {
      key: 'mainTitle',
      type: 'search',
      label: '대표 프로그램명',
      placeholder: '대표 프로그램명을 입력하세요',
    },
    {
      key: 'title',
      type: 'search',
      label: '세부 프로그램명',
      placeholder: '세부 프로그램명을 입력하세요',
    },
    {
      key: 'textbookName',
      type: 'search',
      label: '교재명',
      placeholder: '교재명을 입력하세요',
    },
  ]
}
