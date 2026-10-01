import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  resolveApprovedTrainingFilterDate,
  resolveApprovedTrainingStatus,
} from './resolve-status'

/** Primary Case GEM-04 원인데이터 — trainingDate + 강사로 행 상태 파생 */
describe('resolveApprovedTrainingStatus (Primary Case)', () => {
  const today = dayjs('2026-04-15')

  it('A 미래+강사 = 예정', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: true,
          trainingDate: '2026-05-01',
          lastPreferredDate: '2026-03-01',
        },
        today
      )
    ).toBe('SCHEDULED')
  })

  it('B 당일+강사 = 진행 중', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: true,
          trainingDate: '2026-04-15',
          lastPreferredDate: '2026-03-01',
        },
        today
      )
    ).toBe('IN_PROGRESS')
  })

  it('C 과거+강사 = 완료', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: true,
          trainingDate: '2026-04-01',
          lastPreferredDate: '2026-03-01',
        },
        today
      )
    ).toBe('COMPLETED')
  })

  it('D 3지망 만료+강사없음 = 미진행', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: false,
          trainingDate: '',
          lastPreferredDate: '2026-04-01',
        },
        today
      )
    ).toBe('NOT_CONDUCTED')
  })

  it('미매칭 + 3지망 남음 = 예정', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: false,
          trainingDate: '',
          lastPreferredDate: '2026-04-20',
        },
        today
      )
    ).toBe('SCHEDULED')
  })

  it('filter date는 매칭 시 trainingDate, 미매칭 시 lastPreferredDate', () => {
    expect(
      resolveApprovedTrainingFilterDate({
        instructorAssigned: true,
        trainingDate: '2026-05-01',
        lastPreferredDate: '2026-03-01',
      })
    ).toBe('2026-05-01')
    expect(
      resolveApprovedTrainingFilterDate({
        instructorAssigned: false,
        trainingDate: '',
        lastPreferredDate: '2026-03-01',
      })
    ).toBe('2026-03-01')
  })
})
