import { describe, expect, it } from 'vitest'
import { buildGeneralVolunteerDoc1ListQuery } from './volunteer-list-query'
import { DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'

describe('buildGeneralVolunteerDoc1ListQuery', () => {
  it('returns an empty query for default filters', () => {
    expect(buildGeneralVolunteerDoc1ListQuery(DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS)).toEqual({})
  })

  it('maps searchable filters to OpenAPI query params', () => {
    expect(
      buildGeneralVolunteerDoc1ListQuery({
        volunteerName: '  홍길동 ',
        jaVolunteerExperience: 'yes',
        managerAEvaluation: 'neutral',
        managerBEvaluation: 'unreviewed',
        documentScreeningStatus: 'pending',
      })
    ).toEqual({
      keyword: '홍길동',
      isReparticipation: true,
      managerAEvaluation: 'NEUTRAL',
      managerBEvaluation: 'UNREVIEWED',
      documentStatus: 'PENDING',
    })
  })

  it('sends isReparticipation=false for "없음"', () => {
    expect(
      buildGeneralVolunteerDoc1ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
        jaVolunteerExperience: 'no',
      })
    ).toEqual({ isReparticipation: false })
  })
})
