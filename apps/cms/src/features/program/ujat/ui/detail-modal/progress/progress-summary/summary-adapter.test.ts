import { describe, expect, it } from 'vitest'
import { adaptUjatEducationProgressSummary } from './summary-adapter'

describe('adaptUjatEducationProgressSummary', () => {
  it('서버 지역 코드와 반기 집계를 화면 행으로 매핑한다', () => {
    const result = adaptUjatEducationProgressSummary({
      programId: 10,
      regions: [
        {
          educationRegionCode: 'SEOUL',
          appliedSchoolCount: 2,
          firstHalf: {
            progressingSchoolCount: 1,
            classCount: 3,
            studentCount: 60,
            finalPassVolunteerCount: 4,
          },
          secondHalf: {
            progressingSchoolCount: 0,
            classCount: 0,
            studentCount: 0,
            finalPassVolunteerCount: 2,
          },
          total: { finalPassVolunteerCount: 6 },
        },
      ],
    })

    expect(result.schoolSummary.appliedSchools.regions.seoul).toBe(2)
    expect(result.schoolSummary.semesters[0]?.metrics.operating_classes.regions.seoul).toBe(3)
    expect(result.schoolSummary.semesters[1]?.metrics.operating_students.regions.seoul).toBe(0)
    expect(result.volunteerSummary.rows[0]?.row.regions.seoul).toBe(4)
    expect(result.volunteerSummary.rows[2]?.row.regions.seoul).toBe(6)
  })

  it('미집계 null을 0으로 바꾸지 않는다', () => {
    const result = adaptUjatEducationProgressSummary({
      regions: [
        {
          educationRegionCode: 'SEOUL',
          appliedSchoolCount: null,
          firstHalf: { classCount: null },
        },
      ],
    })

    expect(result.schoolSummary.appliedSchools.regions.seoul).toBeNull()
    expect(result.schoolSummary.semesters[0]?.metrics.operating_classes.regions.seoul).toBeNull()
  })
})
