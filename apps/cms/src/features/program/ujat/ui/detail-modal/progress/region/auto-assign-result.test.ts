import { describe, expect, it } from 'vitest'
import {
  buildAutoAssignResultAlert,
  hasExistingRegionAssignments,
  summarizeAutoAssignResult,
} from './auto-assign-result'
import type { RegionAssignmentTableData } from './types'

function table(cells: RegionAssignmentTableData['rows'][number]['cells']): RegionAssignmentTableData {
  return {
    regionKey: 'seoul',
    regionLabel: '서울',
    volunteerCount: 1,
    columns: [],
    rows: [{ id: '1', name: '김봉사', totalAssignedDays: 0, cells }],
  }
}

describe('hasExistingRegionAssignments', () => {
  it('배정된 셀이 있으면 재실행으로 본다', () => {
    expect(hasExistingRegionAssignments(table([{ kind: 'assigned', classLabel: '3-1' }]))).toBe(true)
  })

  it('빈 셀·불가 셀만 있으면 최초 실행으로 본다', () => {
    expect(
      hasExistingRegionAssignments(table([{ kind: 'empty' }, { kind: 'empty', blockedEmpty: true }]))
    ).toBe(false)
  })
})

describe('buildAutoAssignResultAlert', () => {
  it('1인·미배정이 없으면 안내만 보여준다', () => {
    const alert = buildAutoAssignResultAlert({
      pairAssignedCount: 4,
      singleAssignedCount: 0,
      unassignedCount: 0,
    })
    expect(alert.title).toBe('안내')
    expect(alert.content).toContain('2인 배정 4건 · 1인 배정 0건 · 미배정 0건')
    expect(alert.content).not.toContain('ASSIGNED_SINGLE')
  })

  it('1인 배정·미배정·정원 경고를 함께 경고로 보여준다', () => {
    const alert = buildAutoAssignResultAlert({
      pairAssignedCount: 2,
      singleAssignedCount: 1,
      unassignedCount: 3,
      capacityWarnings: [{ message: '서울 상반기 봉사자 정원이 부족합니다.' }, { message: ' ' }],
    })
    expect(alert.title).toBe('확인 필요')
    expect(alert.content).toContain('1인 배정(ASSIGNED_SINGLE) 1건')
    expect(alert.content).toContain('미배정 3건이 있습니다.')
    expect(alert.content).toContain('· 서울 상반기 봉사자 정원이 부족합니다.')
    expect(alert.content.split('\n').filter(line => line.startsWith('· '))).toHaveLength(3)
  })

  it('1인 슬롯 보강 성공·실패 건수와 인원 부족 경고를 요약한다', () => {
    const summary = summarizeAutoAssignResult({
      pairAssignedCount: 0,
      singleAssignedCount: 0,
      unassignedCount: 0,
      secondaryAddedCount: 2,
      secondaryUnfilledCount: 1,
      capacityWarnings: [
        { capacityType: 'VOLUNTEER_SHORTAGE', maxCount: 6, currentCount: 4, message: '' },
      ],
    })
    expect(summary.lines).toContain('1인 슬롯 보강 성공 2건 · 실패 1건')
    expect(summary.warnings).toEqual([
      '1인 슬롯 보강 실패 1건은 1인으로 유지됩니다.',
      '봉사자 인원이 부족합니다. (필요 6명 · 배정 4명)',
    ])
    expect(summary.hasVolunteerShortage).toBe(true)
  })

  it('경고가 없으면 배너 대상 경고도 없다', () => {
    const summary = summarizeAutoAssignResult({
      pairAssignedCount: 3,
      singleAssignedCount: 0,
      unassignedCount: 0,
      secondaryAddedCount: 1,
      secondaryUnfilledCount: 0,
      capacityWarnings: [],
    })
    expect(summary.warnings).toEqual([])
    expect(summary.hasVolunteerShortage).toBe(false)
  })

  it('응답 집계가 없으면 -로 표시한다', () => {
    expect(buildAutoAssignResultAlert(undefined).content).toContain(
      '2인 배정 - · 1인 배정 - · 미배정 -'
    )
  })
})
