import { describe, expect, it } from 'vitest'
import { inquiriesParamsFromSearchParams } from './inquiry-filter-params'

describe('inquiriesParamsFromSearchParams', () => {
  it('omits empty optional filters', () => {
    expect(inquiriesParamsFromSearchParams(new URLSearchParams())).toEqual({
      page: 0,
      size: 20,
    })
  })

  it('maps URL filter keys to server query params', () => {
    const params = inquiriesParamsFromSearchParams(
      new URLSearchParams(
        'inq_st=PENDING&inq_cat=정산&inq_prog=UJAT&inq_title=문의&inq_mem=홍길동&inq_asg=관리자&inq_from=2026-01-01&inq_to=2026-01-31'
      )
    )
    expect(params).toEqual({
      page: 0,
      size: 20,
      status: 'pending',
      category: '정산',
      programName: 'UJAT',
      title: '문의',
      inquirerName: '홍길동',
      assigneeName: '관리자',
      createdFrom: '2026-01-01',
      createdTo: '2026-01-31',
    })
  })

  it('sends only programId when dashboard link carries inq_pid', () => {
    const params = inquiriesParamsFromSearchParams(
      new URLSearchParams('inq_prog=커리큘럼형&inq_pid=186324&inq_st=ANSWERED')
    )
    expect(params.programId).toBe(186324)
    expect(params.programName).toBeUndefined()
    expect(params.status).toBe('answered')
  })

  it('treats legacy numeric inq_prog as programId only', () => {
    const params = inquiriesParamsFromSearchParams(new URLSearchParams('inq_prog=12'))
    expect(params.programId).toBe(12)
    expect(params.programName).toBeUndefined()
  })

  it('sends createdFrom or createdTo when only one URL date is set', () => {
    expect(inquiriesParamsFromSearchParams(new URLSearchParams('inq_from=2026-01-01'))).toEqual({
      page: 0,
      size: 20,
      createdFrom: '2026-01-01',
    })
    expect(inquiriesParamsFromSearchParams(new URLSearchParams('inq_to=2026-01-31'))).toEqual({
      page: 0,
      size: 20,
      createdTo: '2026-01-31',
    })
  })

  it('does not send ALL category', () => {
    const params = inquiriesParamsFromSearchParams(new URLSearchParams('inq_cat=ALL'))
    expect(params.category).toBeUndefined()
  })
})
