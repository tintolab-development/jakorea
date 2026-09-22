import { describe, expect, it } from 'vitest'
import {
  trainedTeacherListParams,
  trainedTeacherListParamsFromOverviewStatus,
} from './list-params'

describe('trainedTeacherListParamsFromOverviewStatus', () => {
  it('maps overview widget status to TRAINED_TEACHER periodStatus (SCHEDULED not RECRUITING)', () => {
    expect(trainedTeacherListParamsFromOverviewStatus('scheduled')).toEqual({
      keyword: undefined,
      periodStatus: 'SCHEDULED',
      businessYear: undefined,
      targetLevel: undefined,
      progressPhase: undefined,
      operationStartDate: undefined,
      operationEndDate: undefined,
    })
    expect(trainedTeacherListParamsFromOverviewStatus('in_progress')).toEqual({
      keyword: undefined,
      periodStatus: 'IN_PROGRESS',
      businessYear: undefined,
      targetLevel: undefined,
      progressPhase: undefined,
      operationStartDate: undefined,
      operationEndDate: undefined,
    })
    expect(trainedTeacherListParamsFromOverviewStatus('completed')).toEqual({
      keyword: undefined,
      periodStatus: 'COMPLETED',
      businessYear: undefined,
      targetLevel: undefined,
      progressPhase: undefined,
      operationStartDate: undefined,
      operationEndDate: undefined,
    })
  })

  it('passes programType TRAINED_TEACHER in list query', () => {
    expect(
      trainedTeacherListParams(trainedTeacherListParamsFromOverviewStatus('in_progress'))
    ).toMatchObject({
      programType: 'TRAINED_TEACHER',
      periodStatus: 'IN_PROGRESS',
    })
  })

  it('forwards targetLevel list filter to GET query', () => {
    expect(
      trainedTeacherListParams(
        trainedTeacherListParamsFromOverviewStatus('scheduled', { targetLevel: 'elementary' })
      )
    ).toMatchObject({
      programType: 'TRAINED_TEACHER',
      periodStatus: 'SCHEDULED',
      targetLevel: 'elementary',
    })
  })

  it('sends progressPhase on all tab without periodStatus', () => {
    expect(
      trainedTeacherListParams(
        trainedTeacherListParamsFromOverviewStatus(null, { lifecycleStatus: 'in_progress' })
      )
    ).toMatchObject({
      programType: 'TRAINED_TEACHER',
      progressPhase: 'in_progress',
    })
    expect(
      trainedTeacherListParamsFromOverviewStatus(null, { lifecycleStatus: 'in_progress' }).periodStatus
    ).toBeUndefined()
  })

  it('does not map all-tab progressPhase onto widget periodStatus', () => {
    expect(
      trainedTeacherListParamsFromOverviewStatus('scheduled', { lifecycleStatus: 'in_progress' })
    ).toMatchObject({
      periodStatus: 'SCHEDULED',
      progressPhase: undefined,
    })
  })

  it('forwards scheduled-tab operation dates and ignores them on other tabs', () => {
    expect(
      trainedTeacherListParamsFromOverviewStatus('scheduled', {
        operationStartDate: '2025-09-15',
        operationEndDate: '2025-10-15',
      })
    ).toMatchObject({
      periodStatus: 'SCHEDULED',
      operationStartDate: '2025-09-15',
      operationEndDate: '2025-10-15',
    })
    expect(
      trainedTeacherListParamsFromOverviewStatus(null, {
        operationStartDate: '2025-09-15',
        operationEndDate: '2025-10-15',
      })
    ).toMatchObject({
      operationStartDate: undefined,
      operationEndDate: undefined,
    })
  })

  it('normalizes college targetLevel to university', () => {
    expect(
      trainedTeacherListParamsFromOverviewStatus(null, { targetLevel: 'college' }).targetLevel
    ).toBe('university')
  })
})
