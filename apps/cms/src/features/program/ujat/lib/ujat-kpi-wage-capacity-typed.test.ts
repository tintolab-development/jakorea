import { describe, expect, it, vi } from 'vitest'
import {
  UjatRegionCapacityIncompleteError,
  applyUjatKpiWageCapacityFromFormValues,
  listIncompleteUjatRegionCapacityKeys,
  stripUjatKpiWageCapacityOverlay,
  ujatKpiWageCapacityFromLegacyOverlay,
  ujatRegionCapacityStateSnapshot,
  ujatRegionCapacityUpsertsFromState,
} from './ujat-kpi-wage-capacity-typed'
import type { Program } from '@/types/domain'

vi.mock('@/features/program/ujat/lib/ujat-education-regions', () => ({
  listUjatEducationRegionsActive: () => [
    { key: 'SEOUL', label: '서울' },
    { key: 'INCHEON', label: '인천' },
  ],
}))

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
      h1: {
        서울: { classCount: '1', volunteerCount: '2' },
        인천: { classCount: '3', volunteerCount: '4' },
      },
      h2: {
        서울: { classCount: '0', volunteerCount: '9' },
        인천: { classCount: '5', volunteerCount: '6' },
      },
    })
    expect(upserts).toEqual([
      { semesterType: 'FIRST_HALF', educationRegionCode: 'SEOUL', maxClassCount: 1, maxVolunteerCount: 2 },
      { semesterType: 'FIRST_HALF', educationRegionCode: 'INCHEON', maxClassCount: 3, maxVolunteerCount: 4 },
      { semesterType: 'SECOND_HALF', educationRegionCode: 'SEOUL', maxClassCount: 0, maxVolunteerCount: 9 },
      { semesterType: 'SECOND_HALF', educationRegionCode: 'INCHEON', maxClassCount: 5, maxVolunteerCount: 6 },
    ])
  })

  it('지역 정원 빈 칸을 0으로 바꿔 보내지 않고 payload 생성을 막는다', () => {
    const state = {
      h1: {
        서울: { classCount: '0', volunteerCount: '0' },
        인천: { classCount: '3', volunteerCount: '' },
      },
      h2: {
        서울: { classCount: ' ', volunteerCount: '2' },
      },
    }
    expect(listIncompleteUjatRegionCapacityKeys(state)).toEqual([
      'capacity.h1.인천',
      'capacity.h2.서울',
      'capacity.h2.인천',
    ])
    expect(() => ujatRegionCapacityUpsertsFromState(state)).toThrow(UjatRegionCapacityIncompleteError)
    expect(() => ujatRegionCapacityUpsertsFromState(undefined)).toThrow(UjatRegionCapacityIncompleteError)
  })

  it('직접 입력한 0은 0으로 저장하고 미완료로 보지 않는다', () => {
    const zero = { classCount: '0', volunteerCount: '0' }
    const state = { h1: { 서울: zero, 인천: zero }, h2: { 서울: zero, 인천: zero } }
    expect(listIncompleteUjatRegionCapacityKeys(state)).toEqual([])
    expect(
      ujatRegionCapacityUpsertsFromState(state).every(
        row => row.maxClassCount === 0 && row.maxVolunteerCount === 0
      )
    ).toBe(true)
  })

  it('정원 미입력 프로그램은 빈 폼 값과 스냅샷이 같아 변경 없음으로 본다', () => {
    expect(
      ujatRegionCapacityStateSnapshot({
        h1: { 서울: { classCount: '', volunteerCount: '' } },
        h2: {},
      })
    ).toBe(ujatRegionCapacityStateSnapshot(undefined))
  })

  it('변경 비교 스냅샷은 빈 칸과 0을 구분한다', () => {
    expect(
      ujatRegionCapacityStateSnapshot({ h1: { 서울: { classCount: '', volunteerCount: '' } }, h2: {} })
    ).not.toBe(
      ujatRegionCapacityStateSnapshot({ h1: { 서울: { classCount: '0', volunteerCount: '0' } }, h2: {} })
    )
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
