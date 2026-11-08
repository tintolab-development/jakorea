import { describe, expect, it } from 'vitest'
import { buildGeminiRecruitmentListQuery } from '../../api/visiting-training/client'
import { toGeminiRecruitmentRemoteFilters } from './list-remote-filters'

describe('toGeminiRecruitmentRemoteFilters', () => {
  it('조건이 없으면 서버 조건을 비운다', () => {
    expect(toGeminiRecruitmentRemoteFilters({})).toEqual({
      keyword: undefined,
      periodStatus: undefined,
      draftStatus: undefined,
      trainingRequestFrom: undefined,
      trainingRequestTo: undefined,
    })
  })

  it('임시저장 상태는 draftStatus=DRAFT로만 보낸다', () => {
    const filters = toGeminiRecruitmentRemoteFilters({ status: 'DRAFT' })
    expect(filters.draftStatus).toBe('DRAFT')
    expect(filters.periodStatus).toBeUndefined()
  })

  it('예정·모집중·종료는 게시 공고(draftStatus=PUBLISHED) + periodStatus로 보낸다', () => {
    expect(toGeminiRecruitmentRemoteFilters({ status: 'IN_PROGRESS' })).toMatchObject({
      periodStatus: 'RECRUITING',
      draftStatus: 'PUBLISHED',
    })
    expect(toGeminiRecruitmentRemoteFilters({ status: 'ENDED' })).toMatchObject({
      periodStatus: 'COMPLETED',
      draftStatus: 'PUBLISHED',
    })
    expect(toGeminiRecruitmentRemoteFilters({ status: 'ALL' }).draftStatus).toBeUndefined()
  })

  it('공고명·연수요청기간을 서버 쿼리로 보낸다', () => {
    expect(
      toGeminiRecruitmentRemoteFilters({
        title: '  찾아가는 ',
        from: '2026-01-01',
        to: '2026-11-08',
      })
    ).toMatchObject({
      keyword: '찾아가는',
      trainingRequestFrom: '2026-01-01',
      trainingRequestTo: '2026-11-08',
    })
  })

  it('형식이 맞지 않는 날짜는 보내지 않는다', () => {
    const filters = toGeminiRecruitmentRemoteFilters({ from: '2026/01/01', to: 'abc' })
    expect(filters.trainingRequestFrom).toBeUndefined()
    expect(filters.trainingRequestTo).toBeUndefined()
  })
})

describe('buildGeminiRecruitmentListQuery', () => {
  it('서버 검색 조건과 페이지를 쿼리에 싣는다', () => {
    const query = buildGeminiRecruitmentListQuery(
      toGeminiRecruitmentRemoteFilters({
        title: '공고',
        status: 'SCHEDULED',
        from: '2026-01-01',
        to: '2026-11-08',
      }),
      0,
      20
    )
    expect(Object.fromEntries(query)).toEqual({
      keyword: '공고',
      periodStatus: 'SCHEDULED',
      draftStatus: 'PUBLISHED',
      trainingRequestFrom: '2026-01-01',
      trainingRequestTo: '2026-11-08',
      page: '0',
      size: '20',
    })
  })

  it('빈 조건은 쿼리에서 뺀다', () => {
    expect(buildGeminiRecruitmentListQuery({}, 2, 20).toString()).toBe('page=2&size=20')
  })
})
