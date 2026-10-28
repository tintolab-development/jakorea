import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  resolveApprovedTrainingFilterDate,
  resolveApprovedTrainingStatus,
} from './resolve-status'

/** Primary Case GEM-04 — 연수 일정 + 강사 지정/미지정 */
describe('resolveApprovedTrainingStatus (Primary Case)', () => {
  const today = dayjs('2026-04-15')

  it('A 미래 확정 연수일 + 강사 지정 = 예정', () => {
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

  it('B 당일 확정 연수일 + 강사 지정 = 진행 중', () => {
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

  it('C 과거 확정 연수일 + 강사 지정 = 완료', () => {
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

  it('D 희망 연수 일정 만료 + 강사 미지정 = 미진행', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: false,
          trainingDate: '',
          lastPreferredDate: '2026-04-01',
          trainingDateCandidates: [
            { trainingDate: '2026-03-20' },
            { trainingDate: '2026-03-25' },
            { trainingDate: '2026-04-01' },
          ],
        },
        today
      )
    ).toBe('NOT_CONDUCTED')
  })

  it('미지정 + 희망 연수 일정이 남음 = 예정', () => {
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

  it('미지정이면 연수 요청 가능기간이 남아도 희망 연수 일정이 지났으면 미진행', () => {
    expect(
      resolveApprovedTrainingStatus(
        {
          instructorAssigned: false,
          trainingDate: '',
          lastPreferredDate: '2026-10-22',
          trainingDateCandidates: [
            { trainingDate: '2026-10-08' },
            { trainingDate: '2026-10-15' },
            { trainingDate: '2026-10-22' },
          ],
        },
        dayjs('2026-10-29')
      )
    ).toBe('NOT_CONDUCTED')
  })

  it('filter date는 지정 시 확정 연수일, 미지정 시 희망 연수 일정 마지막일', () => {
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
        trainingDateCandidates: [{ trainingDate: '2026-02-01' }, { trainingDate: '2026-03-10' }],
      })
    ).toBe('2026-03-10')
  })
})
