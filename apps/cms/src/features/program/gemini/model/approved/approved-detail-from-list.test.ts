import { describe, expect, it } from 'vitest'
import { mapGeminiApprovedTrainingRowToDetail } from './approved-detail-resolver'
import { resolveApprovedTrainingRowFromListQueries } from './approved-detail-from-list'
import type { GeminiApprovedTrainingRow } from './types'

function row(id: string): GeminiApprovedTrainingRow {
  return {
    id,
    no: 1,
    recruitmentTitle: '승인 연수',
    institutionName: '한국중학교',
    institutionSido: '서울특별시',
    institutionSigungu: '강남구',
    officialDocumentRequired: false,
    lastPreferredDate: '2026-05-01',
    instructorAssigned: false,
    trainingDate: '2026-05-01',
    trainingTimeText: '',
    trainingDateCandidates: [],
    studentCount: 18,
    instructorName: '미지정',
    managerName: '김담당',
  }
}

describe('resolveApprovedTrainingRowFromListQueries', () => {
  it('returns the matching row from a loaded list', () => {
    const target = row('15')
    expect(
      resolveApprovedTrainingRowFromListQueries('15', [
        { rows: [target], fetchStatus: 'idle', status: 'success' },
      ])
    ).toBe(target)
  })

  it('stays loading until the list query settles', () => {
    expect(resolveApprovedTrainingRowFromListQueries('15', [])).toBe('loading')
    expect(
      resolveApprovedTrainingRowFromListQueries('15', [
        { rows: [], fetchStatus: 'fetching', status: 'pending' },
      ])
    ).toBe('loading')
  })

  it('is missing when every list query finished without the id', () => {
    expect(
      resolveApprovedTrainingRowFromListQueries('99', [
        { rows: [row('15')], fetchStatus: 'idle', status: 'success' },
      ])
    ).toBe('missing')
  })

  it('maps the list row into the detail screen model', () => {
    const detail = mapGeminiApprovedTrainingRowToDetail(row('15'))
    expect(detail.id).toBe('15')
    expect(detail.institutionName).toBe('한국중학교')
    expect(detail.institutionAddress).toBe('서울특별시 강남구')
    expect(detail.studentCount).toBe(18)
    expect(detail.managerNameKo).toBe('김담당')
  })
})
