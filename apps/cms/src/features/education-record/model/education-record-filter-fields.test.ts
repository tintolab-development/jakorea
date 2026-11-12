import { describe, expect, it } from 'vitest'
import { FILTER_ADDRESS_REGION_FIELD_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { createEducationRecordFilterFields } from './education-record-filter-fields'

describe('createEducationRecordFilterFields', () => {
  it('년도/분기는 기관 소재지와 같은 콤팩트 50:50 열이다', () => {
    const fields = createEducationRecordFilterFields({ availableYears: [2026] })
    const yearQuarter = fields.find(field => field.key === 'yearQuarter')
    const region = fields.find(field => field.key === 'institutionRegion')

    expect(yearQuarter).toMatchObject({
      type: 'selectPair',
      width: FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
      selectPair: { compact: true },
    })
    expect(region).toMatchObject({
      type: 'addressRegion',
      width: FILTER_ADDRESS_REGION_FIELD_WIDTH_PX,
    })
  })

  it('QA-0371 시/도를 고르면 시/군/구 옵션은 시/군/구명만 보인다', () => {
    const fields = createEducationRecordFilterFields({ availableYears: [2026] })
    const region = fields.find(field => field.key === 'institutionRegion')
    const options = region?.addressRegion?.getSigunguOptions('강원도') ?? []
    const gangneung = options.find(option => option.value === '강릉시')
    expect(gangneung).toEqual({ label: '강릉시', value: '강릉시' })
  })
})
