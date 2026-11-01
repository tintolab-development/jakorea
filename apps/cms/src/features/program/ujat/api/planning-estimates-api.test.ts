import { describe, expect, it } from 'vitest'
import {
  applyPlanningEstimatesToRegionState,
  buildMergedPlanningEstimatePutBody,
  fromPlanningEstimateSemesterType,
} from './planning-estimates-api'

describe('fromPlanningEstimateSemesterType', () => {
  it('FIRST_HALF/SECOND_HALF를 h1/h2로 변환한다', () => {
    expect(fromPlanningEstimateSemesterType('FIRST_HALF')).toBe('h1')
    expect(fromPlanningEstimateSemesterType('SECOND_HALF')).toBe('h2')
    expect(fromPlanningEstimateSemesterType('unknown')).toBeNull()
  })
})

describe('applyPlanningEstimatesToRegionState', () => {
  it('해당 지역 산정값을 학기별로 hydrate한다', () => {
    const next = applyPlanningEstimatesToRegionState(
      {
        estimation: {
          h1: { maxClassesPerDay: '', expectedVolunteerCount: '' },
          h2: { maxClassesPerDay: '', expectedVolunteerCount: '' },
        },
      },
      [
        {
          semesterType: 'FIRST_HALF',
          educationRegionCode: 'SEOUL',
          maxClassesPerDay: 4,
          expectedVolunteerCount: 10,
        },
        {
          semesterType: 'SECOND_HALF',
          educationRegionCode: 'SEOUL',
          maxClassesPerDay: 6,
          expectedVolunteerCount: 12,
        },
        {
          semesterType: 'FIRST_HALF',
          educationRegionCode: 'BUSAN',
          maxClassesPerDay: 9,
          expectedVolunteerCount: 99,
        },
      ],
      'seoul'
    )

    expect(next.estimation.h1).toEqual({
      maxClassesPerDay: '4',
      expectedVolunteerCount: '10',
    })
    expect(next.estimation.h2).toEqual({
      maxClassesPerDay: '6',
      expectedVolunteerCount: '12',
    })
  })
})

describe('buildMergedPlanningEstimatePutBody', () => {
  it('현재 지역은 학기별 UI 값으로 덮고 다른 지역·학기는 보존한다', () => {
    const body = buildMergedPlanningEstimatePutBody({
      existing: [
        {
          semesterType: 'FIRST_HALF',
          educationRegionCode: 'BUSAN',
          maxClassesPerDay: 3,
          expectedVolunteerCount: 8,
        },
        {
          semesterType: 'SECOND_HALF',
          educationRegionCode: 'BUSAN',
          maxClassesPerDay: 3,
          expectedVolunteerCount: 9,
        },
        {
          semesterType: 'FIRST_HALF',
          educationRegionCode: 'SEOUL',
          maxClassesPerDay: 1,
          expectedVolunteerCount: 1,
        },
      ],
      educationRegionCode: 'SEOUL',
      regionState: {
        estimation: {
          h1: { maxClassesPerDay: '5', expectedVolunteerCount: '20' },
          h2: { maxClassesPerDay: '7', expectedVolunteerCount: '22' },
        },
      },
    })

    expect(body.estimates).toEqual([
      {
        semesterType: 'FIRST_HALF',
        educationRegionCode: 'BUSAN',
        maxClassesPerDay: 3,
        expectedVolunteerCount: 8,
      },
      {
        semesterType: 'SECOND_HALF',
        educationRegionCode: 'BUSAN',
        maxClassesPerDay: 3,
        expectedVolunteerCount: 9,
      },
      {
        semesterType: 'FIRST_HALF',
        educationRegionCode: 'SEOUL',
        maxClassesPerDay: 5,
        expectedVolunteerCount: 20,
      },
      {
        semesterType: 'SECOND_HALF',
        educationRegionCode: 'SEOUL',
        maxClassesPerDay: 7,
        expectedVolunteerCount: 22,
      },
    ])
  })
})
