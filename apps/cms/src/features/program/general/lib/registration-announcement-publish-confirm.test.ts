import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildAnnouncementPublishConfirmContent,
  listPublishedRecruitAnnouncements,
} from './registration-announcement-publish-confirm'

function program(info: NonNullable<Program['generalCommonInfo']>): Program {
  return { id: 'p1', generalCommonInfo: info } as unknown as Program
}

describe('listPublishedRecruitAnnouncements', () => {
  it('「게시」인 모집 탭만 참여자→강사→봉사자 순으로 돌려준다', () => {
    const items = listPublishedRecruitAnnouncements(
      program({
        participantRecruitmentInfo: {
          announcementPublished: true,
          recruitmentPeriodLabel: '2026.12.01(화) ~ 2026.12.31(목)',
        },
        instructorRecruitmentInfo: { announcementPublished: false },
        volunteerRecruitmentInfo: { announcementPublished: true, recruitmentPeriodLabel: '-' },
      } as NonNullable<Program['generalCommonInfo']>)
    )
    expect(items).toEqual([
      { audienceLabel: '참여자 모집', recruitmentPeriodLabel: '2026.12.01(화) ~ 2026.12.31(목)' },
      { audienceLabel: '봉사자 모집', recruitmentPeriodLabel: null },
    ])
  })

  it('미게시·미선택만 있으면 확인하지 않는다', () => {
    expect(
      listPublishedRecruitAnnouncements(
        program({
          participantRecruitmentInfo: { announcementPublished: false },
          instructorRecruitmentInfo: {},
        } as NonNullable<Program['generalCommonInfo']>)
      )
    ).toEqual([])
    expect(listPublishedRecruitAnnouncements({ id: 'x' } as unknown as Program)).toEqual([])
  })
})

describe('buildAnnouncementPublishConfirmContent', () => {
  it('노출 대상과 모집 기간(시점)을 나열한다', () => {
    const content = buildAnnouncementPublishConfirmContent([
      { audienceLabel: '강사 모집', recruitmentPeriodLabel: '2026.12.01 ~ 2026.12.10' },
      { audienceLabel: '참여자 모집', recruitmentPeriodLabel: null },
    ])
    expect(content).toContain('· 강사 모집 (모집 기간: 2026.12.01 ~ 2026.12.10)')
    expect(content).toContain('· 참여자 모집\n')
    expect(content).toContain('사용자 홈페이지 모집 공고에 바로 노출됩니다.')
  })
})
