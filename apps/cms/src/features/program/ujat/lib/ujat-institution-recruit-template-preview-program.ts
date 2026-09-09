import type { Program } from '@/types/domain'

/** UJAT 참여자(학교) 모집 폼 양식 편집기 — 필드 미리보기용 mock Program */
export const UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM: Program = {
  id: 'ujat-institution-recruit-template-preview',
  sponsorId: 'sponsor-preview',
  title: '',
  type: 'offline',
  format: 'course',
  category: 'school',
  targetLevel: 'elementary',
  targetLevels: ['elementary'],
  district: '경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교',
  startDate: '',
  endDate: '',
  generalCommonInfo: {
    participantRecruitmentInfo: {
      announcementPublished: true,
      notesNotApplicable: false,
    },
  },
  rounds: [
    {
      id: 'preview-round-1',
      programId: 'ujat-institution-recruit-template-preview',
      roundNumber: 1,
      startDate: '',
      endDate: '',
      status: 'active',
      deliveryType: 'offline',
      curriculum: '',
    },
    {
      id: 'preview-round-2',
      programId: 'ujat-institution-recruit-template-preview',
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
