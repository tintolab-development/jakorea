import { describe, expect, it } from 'vitest'
import { adaptUjatEducationProgressSummary } from './summary-adapter'

describe('adaptUjatEducationProgressSummary', () => {
  it('GET 지역 코드·기수·선발 예정·0을 피그마 행으로 매핑한다', () => {
    const result = adaptUjatEducationProgressSummary({
      programId: 186495,
      programYear: 2026,
      firstHalfActivityTerm: null,
      secondHalfActivityTerm: null,
      regions: [
        {
          educationRegionCode: 'SEOUL',
          educationRegionName: '서울',
          appliedSchoolCount: 10,
          plannedSelectionVolunteerCount: 22,
          firstHalf: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
          secondHalf: {
            progressingSchoolCount: 6,
            classCount: 8,
            studentCount: 186,
            finalPassVolunteerCount: 5,
          },
          total: {
            progressingSchoolCount: 6,
            classCount: 8,
            studentCount: 186,
            finalPassVolunteerCount: 5,
          },
        },
        {
          educationRegionCode: 'GYEONGGI_SOUTH',
          educationRegionName: '경기(남부)',
          appliedSchoolCount: 1,
          plannedSelectionVolunteerCount: 22,
          firstHalf: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
          secondHalf: {
            progressingSchoolCount: 1,
            classCount: 2,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
          total: {
            progressingSchoolCount: 1,
            classCount: 2,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
        },
        {
          educationRegionCode: 'CUSTOM_1793704314696',
          educationRegionName: '123',
          appliedSchoolCount: null,
          plannedSelectionVolunteerCount: null,
          firstHalf: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
          secondHalf: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
          total: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 0,
          },
        },
      ],
    })

    expect(result.columnRegions.map(region => region.key)).toEqual([
      'SEOUL',
      'GYEONGGI_SOUTH',
      'CUSTOM_1793704314696',
    ])
    expect(result.columnRegions[2]?.label).toBe('123')
    expect(result.schoolSummary.appliedSchools.regions.SEOUL).toBe(10)
    expect(result.schoolSummary.semesters.map(row => row.label)).toEqual([
      '1학기',
      '2학기',
      '2026년 종합',
    ])
    expect(result.schoolSummary.semesters[0]?.metrics.operating_schools.regions.SEOUL).toBe(0)
    expect(result.schoolSummary.semesters[1]?.metrics.operating_classes.regions.GYEONGGI_SOUTH).toBe(
      2
    )
    expect(result.schoolSummary.semesters[1]?.metrics.operating_students.regions.GYEONGGI_SOUTH).toBe(
      0
    )
    expect(result.volunteerSummary.rows.map(row => row.label)).toEqual([
      '선발 예정 인원',
      '1학기 최종 합격',
      '2학기 최종 합격',
      '2026 봉사단 최종 인원',
    ])
    expect(result.volunteerSummary.rows[0]?.row.regions.SEOUL).toBe(22)
    expect(result.volunteerSummary.rows[0]?.row.regions.CUSTOM_1793704314696).toBeNull()
    expect(result.volunteerSummary.rows[1]?.row.regions.SEOUL).toBe(0)
    expect(result.volunteerSummary.rows[2]?.row.regions.SEOUL).toBe(5)
    expect(result.volunteerSummary.rows[3]?.row.regions.SEOUL).toBe(5)
    expect(result.volunteerSummary.rows[3]?.mergedTotalOnly).toBeUndefined()
  })

  it('미집계 null을 0으로 바꾸지 않고 반기 합을 FE에서 만들지 않는다', () => {
    const result = adaptUjatEducationProgressSummary({
      regions: [
        {
          educationRegionCode: 'SEOUL',
          appliedSchoolCount: null,
          plannedSelectionVolunteerCount: null,
          firstHalf: { classCount: null, finalPassVolunteerCount: 4 },
          secondHalf: { classCount: null },
          total: { classCount: null, finalPassVolunteerCount: null },
        },
      ],
    })

    expect(result.schoolSummary.appliedSchools.regions.SEOUL).toBeNull()
    expect(result.schoolSummary.semesters[0]?.metrics.operating_classes.regions.SEOUL).toBeNull()
    expect(result.schoolSummary.semesters[2]?.metrics.operating_classes.regions.SEOUL).toBeNull()
    expect(result.volunteerSummary.rows[0]?.row.regions.SEOUL).toBeNull()
    expect(result.volunteerSummary.rows[3]?.row.regions.SEOUL).toBeNull()
  })

  it('기수 문자열이 있으면 기 접미사만 붙이고 회차에서 invent 하지 않는다', () => {
    const result = adaptUjatEducationProgressSummary({
      programYear: 2026,
      firstHalfActivityTerm: '36',
      secondHalfActivityTerm: '37기',
      regions: [],
    })
    expect(result.volunteerSummary.rows.map(row => row.label)).toEqual([
      '선발 예정 인원',
      '36기 최종 합격',
      '37기 최종 합격',
      '2026 봉사단 최종 인원',
    ])
  })
})
