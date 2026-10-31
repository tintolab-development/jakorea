import { describe, expect, it } from 'vitest'
import { isDevAutofillBlankSlot, mergeDevAutofillSparse } from './merge-dev-autofill-sparse'

describe('mergeDevAutofillSparse', () => {
  it('이미 고른 공고 미게시는 덮지 않는다', () => {
    expect(
      mergeDevAutofillSparse(
        { announcementPublished: 'unpublished', title: '' },
        { announcementPublished: 'published', title: '샘플' }
      )
    ).toEqual({ announcementPublished: 'unpublished', title: '샘플' })
  })

  it('boolean false도 사용자 선택으로 본다', () => {
    expect(
      mergeDevAutofillSparse(
        { partnerInvolvement: false },
        { partnerInvolvement: true }
      )
    ).toEqual({ partnerInvolvement: false })
  })

  it('빈 문자열·빈 배열은 채운다', () => {
    expect(isDevAutofillBlankSlot('')).toBe(true)
    expect(isDevAutofillBlankSlot([])).toBe(true)
    expect(
      mergeDevAutofillSparse({ ids: [] as string[] }, { ids: ['p-1'] })
    ).toEqual({ ids: ['p-1'] })
  })

  it('rounds처럼 부분만 찬 중첩 배열은 빈 칸(curriculum)만 채운다', () => {
    expect(
      mergeDevAutofillSparse(
        {
          rounds: [{ startDate: '2026-03-01', curriculum: '' }],
          volunteerApplicationStartDate: '',
        },
        {
          rounds: [{ startDate: '2026-03-02', curriculum: '1' }],
          volunteerApplicationStartDate: '2026-03-02',
        }
      )
    ).toEqual({
      rounds: [{ startDate: '2026-03-01', curriculum: '1' }],
      volunteerApplicationStartDate: '2026-03-02',
    })
  })
})
