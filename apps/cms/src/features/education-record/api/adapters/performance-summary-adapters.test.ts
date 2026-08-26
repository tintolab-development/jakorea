import { describe, expect, it } from 'vitest'
import {
  buildSummaryTabViewFromRows,
  mapPerformanceStatsToSummaryTabView,
  mapTargetTotalToSummaryRow,
  resolveSummaryCategoryKey,
  resolveSummarySubRowKey,
} from './performance-summary-adapters'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

describe('performance-summary-adapters', () => {
  it('maps TargetTotal field names onto SummaryRow', () => {
    expect(
      mapTargetTotalToSummaryRow({
        schoolCount: 2,
        classCount: 3,
        totalParticipants: 40,
        educationHours: 5,
        generalVolunteerCount: 1,
        employeeVolunteerCount: 2,
        generalTeacherCount: 3,
        trainedTeacherCount: 4,
        instructorCount: 5,
      })
    ).toEqual({
      schoolCount: 2,
      classCount: 3,
      participants: 40,
      educationHours: 5,
      generalVolunteers: 1,
      staffVolunteers: 2,
      generalTeachers: 3,
      educatedTeachers: 4,
      instructors: 5,
    })
  })

  it('resolves businessArea and targetLevel labels', () => {
    expect(resolveSummaryCategoryKey('경제금융')).toBe('economyFinance')
    expect(resolveSummaryCategoryKey('digital-literacy')).toBe('digitalLiteracy')
    expect(resolveSummarySubRowKey('elementary')).toBe('elementary')
    expect(resolveSummarySubRowKey('고등학교')).toBe('high')
  })

  it('maps API sections into category buckets and grand total', () => {
    const view = mapPerformanceStatsToSummaryTabView({
      sections: [
        {
          businessArea: '경제금융',
          rows: [
            {
              targetLevel: 'elementary',
              schoolCount: 1,
              classCount: 2,
              totalParticipants: 10,
              educationHours: 3,
              generalVolunteerCount: 0,
              employeeVolunteerCount: 0,
              generalTeacherCount: 0,
              trainedTeacherCount: 0,
              instructorCount: 1,
            },
          ],
          total: {
            schoolCount: 1,
            classCount: 2,
            totalParticipants: 10,
            educationHours: 3,
            instructorCount: 1,
          },
        },
      ],
    })

    expect(view.byCategory.economyFinance.elementary?.participants).toBe(10)
    expect(view.byCategory.economyFinance.total?.schoolCount).toBe(1)
    expect(view.grandTotal.participants).toBe(10)
    expect(view.grandTotal.instructors).toBe(1)
  })

  it('aggregates list rows when building mock summary', () => {
    const rows: EducationRecordRow[] = [
      {
        id: '1',
        businessArea: '경제금융',
        targetLevel: 'elementary',
        schoolOrOrganizationName: 'A초',
        classCount: 1,
        totalParticipants: 5,
        educationHours: 2,
        instructors: 1,
      },
      {
        id: '2',
        businessArea: '경제금융',
        targetLevel: 'elementary',
        schoolOrOrganizationName: 'B초',
        classCount: 2,
        totalParticipants: 7,
        educationHours: 1,
        instructors: 1,
      },
    ]

    const view = buildSummaryTabViewFromRows(rows)
    expect(view.byCategory.economyFinance.elementary).toEqual({
      schoolCount: 2,
      classCount: 3,
      participants: 12,
      educationHours: 3,
      generalVolunteers: 0,
      staffVolunteers: 0,
      generalTeachers: 0,
      educatedTeachers: 0,
      instructors: 2,
    })
    expect(view.grandTotal.participants).toBe(12)
  })
})
