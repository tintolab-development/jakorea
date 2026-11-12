import { describe, expect, it } from 'vitest'
import { resolveRecruitmentAnnouncementDisplayLabel } from './resolve-recruitment-display'

describe('resolveRecruitmentAnnouncementDisplayLabel (QA-0101)', () => {
  it('미게시(임시저장)를 선택한 공고는 날짜와 상관없이 미게시', () => {
    expect(resolveRecruitmentAnnouncementDisplayLabel('2026-01-01', '2026-11-12', 'unpublished')).toBe(
      '미게시'
    )
    expect(resolveRecruitmentAnnouncementDisplayLabel('2026-12-01', '2026-11-12', 'unpublished')).toBe(
      '미게시'
    )
  })

  it('게시를 선택한 공고는 신청 시작일 기준으로 게시 예정/게시', () => {
    expect(resolveRecruitmentAnnouncementDisplayLabel('2026-12-01', '2026-11-12', 'published')).toBe(
      '게시 예정'
    )
    expect(resolveRecruitmentAnnouncementDisplayLabel('2026-11-12', '2026-11-12', 'published')).toBe(
      '게시'
    )
  })

  it('게시 여부를 모르면 기존처럼 날짜로만 판단한다', () => {
    expect(resolveRecruitmentAnnouncementDisplayLabel('2026-11-01', '2026-11-12')).toBe('게시')
  })
})
