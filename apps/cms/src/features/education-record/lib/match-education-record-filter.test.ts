import { describe, expect, it } from 'vitest'
import { matchesEducationRecordFilter } from './match-education-record-filter'
import type { EducationRecordPendingFilters, EducationRecordRow } from '../model/education-record-types'

const emptyFilters: EducationRecordPendingFilters = {
  year: '',
  quarter: 'ALL',
  businessArea: '',
  sido: '',
  sigungu: '',
  sponsorName: '',
  mainTitle: '',
  title: '',
  textbookName: '',
  institutionName: '',
  ips: '',
  educationType: '',
}

const row: EducationRecordRow = {
  id: '1',
  educationMonth: '2026-06',
  businessArea: '경제금융',
  sponsorNameKo: '현대캐피탈',
  mainTitle: '1사1교',
  title: '1사1교 경제금융교육',
  textbookName: 'JA 경제',
  schoolOrOrganizationName: '월계초등학교',
  ips: 'Prepare',
  educationType: 'offline',
}

describe('matchesEducationRecordFilter', () => {
  it('matches empty filters', () => {
    expect(matchesEducationRecordFilter(row, emptyFilters)).toBe(true)
  })

  it('filters by planning fields', () => {
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, businessArea: '경제금융' })).toBe(
      true
    )
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, businessArea: '진로취업' })).toBe(
      false
    )
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, institutionName: '월계' })).toBe(
      true
    )
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, ips: 'Inspire' })).toBe(false)
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, educationType: 'offline' })).toBe(
      true
    )
    expect(matchesEducationRecordFilter(row, { ...emptyFilters, educationType: 'online' })).toBe(
      false
    )
  })
})
