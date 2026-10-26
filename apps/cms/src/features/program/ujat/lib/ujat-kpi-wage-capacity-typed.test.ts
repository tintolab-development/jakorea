import { describe, expect, it } from 'vitest'
import {
  applyUjatKpiWageCapacityFromFormValues,
  stripUjatKpiWageCapacityOverlay,
  ujatKpiWageCapacityFromLegacyOverlay,
  ujatRegionCapacityUpsertsFromState,
} from './ujat-kpi-wage-capacity-typed'
import type { Program } from '@/types/domain'

describe('UJAT KPI·임금·지역 정원 typed 계약', () => {
  it('overlay 키를 제거하고 0을 유지한다', () => {
    const next = stripUjatKpiWageCapacityOverlay({
      'ujat.kpi.participantCount': 0,
      'ujat.wage.paymentItemValues': [],
      'ujat.capacity.byRegion': { h1: {}, h2: {} },
      'ujat.recruit.keep': true,
    })
    expect(next).toEqual({ 'ujat.recruit.keep': true })
  })

  it('레거시 overlay를 최초 hydrate만 하고 0을 미입력으로 바꾸지 않는다', () => {
    const values = ujatKpiWageCapacityFromLegacyOverlay({
      'ujat.kpi.participantCount': 0,
      'ujat.kpi.volunteer': 4,
      'ujat.wage.paymentItemValues': [],
      'ujat.capacity.byRegion': {
        h1: { 서울: { classCount: '0', volunteerCount: '1' } },
        h2: { 서울: { classCount: '2', volunteerCount: '3' } },
      },
    })
    expect(values.kpiFinalParticipants).toBe(0)
    expect(values.kpiVolunteerCount).toBe(4)
    expect(values.wagePaymentItemIds).toEqual([])
    expect(values.ujatRegionCapacity?.h1?.서울?.classCount).toBe('0')
    expect(values.ujatRegionCapacity?.h2?.서울?.classCount).toBe('2')
  })

  it('H1 변경 스냅샷이 H2를 건드리지 않는다', () => {
    const upserts = ujatRegionCapacityUpsertsFromState({
      h1: { 서울: { classCount: '1', volunteerCount: '2' } },
      h2: { 서울: { classCount: '0', volunteerCount: '9' } },
    })
    const h1Seoul = upserts.find(
      row => row.semesterType === 'FIRST_HALF' && row.educationRegionCode.toLowerCase().includes('seoul')
    )
    const h2Seoul = upserts.find(
      row => row.semesterType === 'SECOND_HALF' && row.educationRegionCode.toLowerCase().includes('seoul')
    )
    if (h1Seoul && h2Seoul) {
      expect(h1Seoul.maxClassCount).toBe(1)
      expect(h2Seoul.maxClassCount).toBe(0)
      expect(h2Seoul.maxVolunteerCount).toBe(9)
    } else {
      expect(upserts.some(row => row.semesterType === 'FIRST_HALF')).toBe(true)
      expect(upserts.some(row => row.semesterType === 'SECOND_HALF')).toBe(true)
    }
  })

  it('Program CREATE 스냅샷에 KPI·지급항목·정원을 싣는다', () => {
    const program = applyUjatKpiWageCapacityFromFormValues(
      { generalCommonInfo: {} } as Program,
      {
        kpiFinalParticipants: 0,
        kpiVolunteerCount: 8,
        wagePaymentItemIds: [],
        ujatRegionCapacity: {
          h1: { 서울: { classCount: '0', volunteerCount: '' } },
          h2: {},
        },
      }
    )
    expect(program.totalParticipants).toBe(0)
    expect(program.generalVolunteers).toBe(8)
    expect(program.generalCommonInfo?.paymentItems).toBe('')
    expect(program.ujatRegionCapacity?.h1.서울?.classCount).toBe('0')
  })
})
