import { describe, expect, it } from 'vitest'
import { resolveApplicantListTableMinScrollX } from './applicant-list-table-scroll'

describe('resolveApplicantListTableMinScrollX', () => {
  it('sums selection + numeric column widths', () => {
    expect(
      resolveApplicantListTableMinScrollX([
        { title: 'No.', width: 80 },
        { title: '기관', width: 180 },
        { title: '소재지', width: 200 },
        { title: '승인', width: 160 },
        { title: '학년', width: 110 },
        { title: '학급', width: 120 },
        { title: '학생', width: 110 },
        { title: '교사', width: 120 },
      ])
    ).toBe(68 + 80 + 180 + 200 + 160 + 110 + 120 + 110 + 120)
  })

  it('parses px strings and falls back for missing width', () => {
    expect(
      resolveApplicantListTableMinScrollX([
        { title: 'No.', width: 80 },
        { title: '승인', width: '180px' },
        { title: '학년' },
      ])
    ).toBe(68 + 80 + 180 + 120)
  })

  it('can omit selection column', () => {
    expect(
      resolveApplicantListTableMinScrollX([{ title: 'No.', width: 80 }], {
        includeSelection: false,
      })
    ).toBe(80)
  })
})
