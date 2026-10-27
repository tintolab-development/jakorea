import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('../src/shared/api/axios-instance', () => ({
  axiosClient: { get },
}))

import { fetchPortalPrograms } from '../src/features/program/api/client'
import {
  normalizePortalProgramFilterValues,
  toPortalProgramListQuery,
} from '../src/features/program/api/list-query'
import { DEFAULT_PROGRAMS_LIST_PARAMS } from '../src/features/program/lib/constants'
import { buildProgramsListPath, readProgramsListParams } from '../src/features/program/lib/list-params'
import { platformQueryKeys } from '../src/shared/api/query-keys'

describe('portal program list contract', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('sends independent recruitment and education target filters with an inclusive date range', async () => {
    const query = toPortalProgramListQuery(
      {
        ...DEFAULT_PROGRAMS_LIST_PARAMS,
        q: '금융',
        recruitmentTarget: 'high',
        educationTarget: 'university',
        operatingPeriod: '2026-09-01~2026-12-31',
        educationForm: 'participant_choice',
        page: 2,
      },
      10,
    )
    get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { items: [{ programId: 1 }], page: 1, size: 10, totalElements: 11, totalPages: 2 },
      },
    })

    const page = await fetchPortalPrograms(query)

    expect(get).toHaveBeenCalledWith(
      '/api/portal/programs',
      expect.objectContaining({
        params: expect.any(URLSearchParams),
      }),
    )
    const requestParams = get.mock.calls[0]?.[1]?.params as URLSearchParams
    expect(requestParams.get('keyword')).toBe('금융')
    expect(requestParams.getAll('recruitmentTarget')).toEqual(['high'])
    expect(requestParams.getAll('educationTarget')).toEqual(['university'])
    expect(requestParams.get('operatingFrom')).toBe('2026-09-01')
    expect(requestParams.get('operatingTo')).toBe('2026-12-31')
    expect(requestParams.get('educationMethod')).toBe('PARTICIPANT_SELECTION')
    expect(requestParams.get('page')).toBe('1')
    expect(requestParams.get('size')).toBe('10')
    expect(requestParams.toString()).not.toContain('educationTargets')
    expect(page.items).toHaveLength(1)
    expect(page.totalElements).toBe(11)
    expect(page.totalPages).toBe(2)
  })

  it('sends multiple values of the same filter as repeated query parameters', async () => {
    const query = toPortalProgramListQuery(
      {
        ...DEFAULT_PROGRAMS_LIST_PARAMS,
        recruitmentTarget: 'high',
        recruitmentTargetValues: ['high', 'middle'],
        educationTarget: 'university',
        educationTargetValues: ['university', 'adult'],
        q: '금융',
      },
      10,
    )
    get.mockResolvedValueOnce({ data: { items: [], totalElements: 0, totalPages: 0 } })

    await fetchPortalPrograms(query)

    const requestParams = get.mock.calls[0]?.[1]?.params as URLSearchParams
    expect(requestParams.getAll('recruitmentTarget')).toEqual(['high', 'middle'])
    expect(requestParams.getAll('educationTarget')).toEqual(['university', 'adult'])
    expect(requestParams.get('keyword')).toBe('금융')
    expect(requestParams.toString()).not.toContain('recruitmentTarget%5B%5D')
    expect(requestParams.toString()).not.toContain('educationTarget%5B%5D')
  })

  it('sends a direct volunteer application type filter without changing the audience tab', async () => {
    const query = toPortalProgramListQuery(
      {
        ...DEFAULT_PROGRAMS_LIST_PARAMS,
        q: 'DEV-UJAT-REG05-2027-샘플01',
        applicationType: 'VOLUNTEER',
      },
      10,
    )
    get.mockResolvedValueOnce({ data: { items: [], totalElements: 0, totalPages: 0 } })

    await fetchPortalPrograms(query)

    const requestParams = get.mock.calls[0]?.[1]?.params as URLSearchParams
    expect(requestParams.get('keyword')).toBe('DEV-UJAT-REG05-2027-샘플01')
    expect(requestParams.get('applicationType')).toBe('VOLUNTEER')
    expect(requestParams.get('portalTab')).toBeNull()
  })

  it('keeps single-value requests compatible and normalizes query-key order', () => {
    const single = toPortalProgramListQuery(
      {
        ...DEFAULT_PROGRAMS_LIST_PARAMS,
        recruitmentTarget: 'high',
      },
      10,
    )
    expect(single.recruitmentTarget).toBe('high')
    expect(Array.isArray(single.recruitmentTarget)).toBe(false)

    const first = platformQueryKeys.program.list({
      keyword: '금융',
      portalTab: [],
      applicationType: [],
      programType: [],
      recruitmentStatus: [],
      recruitmentTarget: normalizePortalProgramFilterValues(['high', 'middle']),
      educationTarget: normalizePortalProgramFilterValues(['university']),
      educationMethod: [],
      operatingFrom: '',
      operatingTo: '',
      sort: 'LATEST',
      page: 0,
      size: 10,
    })
    const second = platformQueryKeys.program.list({
      keyword: '금융',
      portalTab: [],
      applicationType: [],
      programType: [],
      recruitmentStatus: [],
      recruitmentTarget: normalizePortalProgramFilterValues(['middle', 'high']),
      educationTarget: normalizePortalProgramFilterValues(['university']),
      educationMethod: [],
      operatingFrom: '',
      operatingTo: '',
      sort: 'LATEST',
      page: 0,
      size: 10,
    })
    expect(first).toEqual(second)
  })

  it('round-trips date filters and page state through the URL', () => {
    const params = readProgramsListParams(
      '?q=%EA%B8%88%EC%9C%B5&applicationType=volunteer&operatingPeriod=2026-09-01~2026-12-31&page=3&educationTarget=university',
    )

    expect(params.applicationType).toBe('VOLUNTEER')
    expect(params.operatingPeriod).toBe('2026-09-01~2026-12-31')
    expect(params.page).toBe(3)
    expect(params.educationTarget).toBe('university')
    expect(buildProgramsListPath(params)).toBe(
      '/programs?q=%EA%B8%88%EC%9C%B5&applicationType=VOLUNTEER&operatingPeriod=2026-09-01%7E2026-12-31&educationTarget=university&page=3',
    )
  })

  it('round-trips repeated URL filters without changing the existing single-value UI fields', () => {
    const params = readProgramsListParams(
      '?recruitmentTarget=high&recruitmentTarget=middle&educationTarget=university&educationTarget=adult',
    )

    expect(params.recruitmentTarget).toBe('high')
    expect(params.recruitmentTargetValues).toEqual(['high', 'middle'])
    expect(params.educationTarget).toBe('university')
    expect(params.educationTargetValues).toEqual(['university', 'adult'])
    expect(buildProgramsListPath(params)).toBe(
      '/programs?recruitmentTarget=high&recruitmentTarget=middle&educationTarget=university&educationTarget=adult',
    )
  })
})
