import { describe, expect, it } from 'vitest'
import {
  AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE,
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

describe('AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE', () => {
  it('완료된 2인조 유지와 1인 보강·미배정만 대상임을 알린다', () => {
    expect(AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE).toContain('이미 2인으로 배정된 학급')
    expect(AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE).toContain('미배정 학급과 기존 1인 학급만')
    expect(AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE).toContain('1인씩 나누는 재분배는 하지 않습니다')
    expect(AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE).not.toContain('기존 배정은 유지되고 미배정 교육일·학급만')
  })
})

describe('buildAutoAssignResultAlert', () => {
  it('전체 학급 2인 배정이면 안내만 보여준다', () => {
    const alert = buildAutoAssignResultAlert({
      targetSlotCount: 4,
      pairAssignedCount: 4,
      singleAssignedCount: 0,
      unassignedCount: 0,
      secondaryAddedCount: 0,
      secondaryUnfilledCount: 0,
    })
    expect(alert.title).toBe('안내')
    expect(alert.content).toContain('대상 학급 4건')
    expect(alert.content).toContain('2인 배정 4건 · 1인 배정 0건 · 미배정 0건')
    expect(alert.content).not.toContain('ASSIGNED_SINGLE')
  })

  it('1인 배정과 완전 미배정을 다른 안내로 보여준다', () => {
    const alert = buildAutoAssignResultAlert({
      pairAssignedCount: 2,
      singleAssignedCount: 1,
      unassignedCount: 3,
      capacityWarnings: [{ message: '서울 상반기 봉사자 정원이 부족합니다.' }, { message: ' ' }],
    })
    expect(alert.title).toBe('확인 필요')
    expect(alert.content).toContain('봉사자가 부족해 일부 학급이 1인으로 배정되었습니다. (1건)')
    expect(alert.content).toContain(
      '배정 가능한 봉사자가 부족하여 일부 학급이 미배정 상태입니다. (3건)'
    )
    expect(alert.content).toContain('· 서울 상반기 봉사자 정원이 부족합니다.')
    expect(alert.content).not.toContain('ASSIGNED_SINGLE')
    expect(alert.content.split('\n').filter(line => line.startsWith('· '))).toHaveLength(3)
  })

  it('1인 학급 보강 성공·실패와 VOLUNTEER_SHORTAGE를 구분한다', () => {
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
    expect(summary.lines).toContain('1인 학급 보강 성공 2건 · 실패 1건')
    expect(summary.warnings).toEqual([
      '일부 학급의 추가 봉사자 배정이 완료되지 않았습니다. (1건)',
    ])
    expect(summary.hasVolunteerShortage).toBe(true)
  })

  it('미배정만 있으면 1인 부족 경고로 취급하지 않는다', () => {
    const summary = summarizeAutoAssignResult({
      pairAssignedCount: 1,
      singleAssignedCount: 0,
      unassignedCount: 1,
      secondaryAddedCount: 0,
      secondaryUnfilledCount: 0,
      capacityWarnings: [],
    })
    expect(summary.hasVolunteerShortage).toBe(false)
    expect(summary.warnings).toEqual([
      '배정 가능한 봉사자가 부족하여 일부 학급이 미배정 상태입니다. (1건)',
    ])
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
    expect(buildAutoAssignResultAlert(undefined).content).toContain('대상 학급 -')
  })
})
