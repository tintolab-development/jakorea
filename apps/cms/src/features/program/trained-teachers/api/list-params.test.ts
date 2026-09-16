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
    })
    expect(trainedTeacherListParamsFromOverviewStatus('in_progress')).toEqual({
      keyword: undefined,
      periodStatus: 'IN_PROGRESS',
      businessYear: undefined,
    })
    expect(trainedTeacherListParamsFromOverviewStatus('completed')).toEqual({
      keyword: undefined,
      periodStatus: 'COMPLETED',
      businessYear: undefined,
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
})
