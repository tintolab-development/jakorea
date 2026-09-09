import type { Program } from '@/types/domain'

/** UJAT 봉사자 모집 폼 양식 편집기 — 필드 미리보기용 mock Program */
export const UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM: Program = {
  id: 'ujat-volunteer-recruit-template-preview',
  sponsorId: 'sponsor-preview',
  title: '',
  type: 'offline',
  format: 'course',
  category: 'school',
  volunteerTarget: '대학(원)생, 성인',
  volunteerTargets: ['대학(원)생', '성인'],
  volunteerTargetDetail: '전공무관, 휴학생 지원 가능',
  startDate: '',
  endDate: '',
  generalCommonInfo: {
    volunteerRecruitmentInfo: {
      announcementPublished: true,
      noticeExposureTiming: 'start-day',
      notesNotApplicable: false,
    },
  },
  rounds: [
    {
      id: 'preview-round-1',
      programId: 'ujat-volunteer-recruit-template-preview',
      roundNumber: 1,
      startDate: '',
      endDate: '',
      status: 'active',
      deliveryType: 'offline',
      curriculum: '',
    },
    {
      id: 'preview-round-2',
      programId: 'ujat-volunteer-recruit-template-preview',
      roundNumber: 2,
      startDate: '',
      endDate: '',
      status: 'active',
      deliveryType: 'offline',
      curriculum: '',
    },
  ],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}
