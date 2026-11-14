import type { Program } from '@/types/domain'

/** UJAT 참여자(학교) 모집 폼 양식 편집기 — 필드 미리보기용 mock Program */
export const UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM: Program = {
  id: 'ujat-institution-recruit-template-preview',
  sponsorId: 'sponsor-preview',
  title: '',
  type: 'offline',
  format: 'course',
  category: 'school',
  // 교육 대상·교육 대상 상세는 템플릿 관리에서 빈 값으로 시작(2026-11-13 요청)
  startDate: '',
  endDate: '',
  generalCommonInfo: {
    // 공고 게시 여부는 템플릿 관리에서 미선택으로 시작
    participantRecruitmentInfo: {
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
