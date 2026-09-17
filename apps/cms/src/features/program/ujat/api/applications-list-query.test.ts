import { describe, expect, it } from 'vitest'
import {
  buildUjatInstitutionApplicationsListQuery,
  buildUjatVolunteerDoc1ListQuery,
  buildUjatVolunteerDocPassedListQuery,
  buildUjatVolunteerInterview2ListQuery,
} from './applications-list-query'
import { DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-screening/filter-fields'
import { DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/doc-passed/filter-fields'
import { DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview2/filter-fields'
import { EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

describe('buildUjatVolunteerDoc1ListQuery', () => {
  it('maps searchable filters to OpenAPI query params', () => {
    expect(
      buildUjatVolunteerDoc1ListQuery({
        ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
        volunteerName: ' 김봉사 ',
        documentScreeningStatus: 'pass',
        managerAEvaluation: 'neutral',
        applicationType: 'ujat-graduate',
      })
    ).toEqual({
      keyword: '김봉사',
      documentStatus: 'PASS',
      managerAEvaluation: 'NEUTRAL',
      isReparticipation: true,
    })
  })

  it('omits empty / ALL filters', () => {
    expect(buildUjatVolunteerDoc1ListQuery(DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS)).toEqual({})
  })
})

describe('buildUjatVolunteerDocPassedListQuery', () => {
  it('always requests document PASS and optional interview status', () => {
    expect(
      buildUjatVolunteerDocPassedListQuery({
        ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS,
        volunteerName: '이봉사',
        interviewAssignmentStatus: 'assigned',
      })
    ).toEqual({
      documentStatus: 'PASS',
      keyword: '이봉사',
      interviewStatus: 'ASSIGNED',
    })
  })
})

describe('buildUjatVolunteerInterview2ListQuery', () => {
  it('maps final result and withdrawn interview status', () => {
    expect(
      buildUjatVolunteerInterview2ListQuery({
        ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
        secondInterviewScreeningStatus: 'reserve2',
      })
    ).toEqual({
      documentStatus: 'PASS',
      finalResultStatus: 'RESERVE',
    })

    expect(
      buildUjatVolunteerInterview2ListQuery({
        ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
        secondInterviewScreeningStatus: 'withdrawn',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStatus: 'WITHDRAWN',
    })
  })
})

describe('buildUjatInstitutionApplicationsListQuery', () => {
  it('maps institution name and temp assignment status', () => {
    expect(
      buildUjatInstitutionApplicationsListQuery({
        ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
        institutionName: '서울초',
        tempAssignmentStatus: 'temp_assigned',
      })
    ).toEqual({
      keyword: '서울초',
      status: 'TEMP_ASSIGNED',
    })
  })
})
