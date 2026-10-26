import { describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../src/shared/api/axios-instance', () => ({
  axiosClient: { get },
}))

import { fetchPublicTextbooks } from '../src/features/textbook/api/client'
import {
  mapPublicTextbookDetail,
  mapPublicTextbookListItem,
} from '../src/features/textbook/api/mappers'
import { hasTextbookUnitIntroduction } from '../src/features/textbook/lib/detail-display'
import { toPublicTextbookListQuery } from '../src/features/textbook/lib/list-query'

describe('platform textbook', () => {
  it('builds the filtered, sorted, zero-based public list query', () => {
    expect(
      toPublicTextbookListQuery({ category: 'all', sort: 'latest', page: 1 })
    ).toEqual({ sort: 'LATEST', page: 0, size: 10 })
    expect(
      toPublicTextbookListQuery({ category: 'digital', sort: 'name', page: 3 })
    ).toEqual({ fieldCode: 'DIGITAL_LITERACY', sort: 'NAME', page: 2, size: 10 })
  })

  it('maps the public card fields without inventing composition data', () => {
    const mapped = mapPublicTextbookListItem({
      id: 101,
      thumbnailUrl: 'https://example.test/book.png',
      businessField: {
        fieldCode: 'CAREER_EMPLOYMENT',
        displayName: '진로·취업',
        description: '사업 분야 설명',
      },
      targets: [{ targetCode: 'MIDDLE_SCHOOL', targetName: '중학생' }],
      educationEffect: '진로 역량 향상',
      textbookName: '테스트 교재',
      description: '교재 설명',
      unitCount: 4,
      sessionDescription: '30분 수업기준 4차시 교육',
      createdAt: '2026-10-25T00:00:00Z',
    })

    expect(mapped).toMatchObject({
      title: '테스트 교재',
      description: '교재 설명',
      unitCount: 4,
      unitSessionText: '30분 수업기준 4차시 교육',
      level: 'middle',
      tags: ['중학생', '진로·취업'],
      modalTags: [
        { label: '중학생', icon: 'target' },
        { label: '진로·취업', icon: 'category' },
        { label: '진로 역량 향상', icon: 'skill' },
      ],
    })
    expect(mapped?.compositions).toBeUndefined()
  })

  it('maps detail unit information and hides empty introductions', () => {
    const detail = mapPublicTextbookDetail({
      id: 102,
      thumbnailUrl: undefined,
      businessField: {
        fieldCode: 'DIGITAL_LITERACY',
        displayName: '디지털 리터러시',
        description: undefined,
      },
      targets: [],
      educationEffect: undefined,
      textbookName: '상세 교재',
      description: '상세 설명',
      unitCount: 2,
      sessionDescription: '2차시 교육',
      unitIntroHtml: '<p>차시별 학습 내용</p>',
      createdAt: '2026-10-25T00:00:00Z',
    })

    expect(detail).toMatchObject({
      unitCount: 2,
      unitSessionText: '2차시 교육',
      unitIntroHtml: '<p>차시별 학습 내용</p>',
    })
    expect(hasTextbookUnitIntroduction(detail!)).toBe(true)
    expect(
      hasTextbookUnitIntroduction({ unitIntroHtml: '<p> &nbsp; </p>', units: [] })
    ).toBe(false)
  })

  it('preserves the server filtered total and pagination metadata', async () => {
    get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          totalCount: 21,
          page: 0,
          size: 10,
          totalPages: 3,
        },
      },
    })

    await expect(
      fetchPublicTextbooks({ fieldCode: 'CAREER_EMPLOYMENT', sort: 'LATEST', page: 0, size: 10 })
    ).resolves.toEqual({ items: [], totalCount: 21, page: 0, size: 10, totalPages: 3 })
    expect(get).toHaveBeenCalledWith(
      '/api/public/education/textbooks',
      expect.objectContaining({
        params: { fieldCode: 'CAREER_EMPLOYMENT', sort: 'LATEST', page: 0, size: 10 },
      })
    )
  })
})
