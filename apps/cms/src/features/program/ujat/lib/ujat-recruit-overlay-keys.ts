/**
 * UJAT 모집 overlay 키 — import 순환 방지용 단독 모듈.
 *
 * 활성 모집 탭 SSOT는 GET `recruitments[]` 행이다. 아래 키는
 * Template authoring·등록 위저드 draft·면접 슬롯처럼 행 DTO에 없는 필드의
 * Legacy compatibility용이다. 행 필드(공고명·기간·담당자·안내 문구)를
 * Overlay로 다시 덮지 않는다.
 *
 * BACKEND BLOCKER: ProgramRecruitmentRequest/Response에는 selectedSlotKeys,
 * timeUnit, interviewTimeRange, exception schedule이 없다.
 */

export const UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS = {
  announcementPublished: 'ujat.recruit.institution.announcementPublished',
  publicTitle: 'ujat.recruit.institution.publicTitle',
  programRange: 'ujat.recruit.institution.programRange',
  targetLevels: 'ujat.recruit.institution.targetLevels',
  district: 'ujat.recruit.institution.district',
  recruitRange: 'ujat.recruit.institution.recruitRange',
  resultAnnounce: 'ujat.recruit.institution.resultAnnounce',
  contact: 'ujat.recruit.institution.contact',
  notes: 'ujat.recruit.institution.notes',
  description: 'ujat.recruit.institution.description',
  recruitmentGuide: 'ujat.recruit.institution.recruitmentGuide',
  applicationMethod: 'ujat.recruit.institution.applicationMethod',
  learningSupportContent: 'ujat.recruit.institution.learningSupportContent',
  additionalContentHtml: 'ujat.recruit.institution.additionalContentHtml',
  attachmentFileNames: 'ujat.recruit.institution.attachmentFileNames',
} as const

export const UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS = {
  announcementPublished: 'ujat.recruit.volunteer.announcementPublished',
  noticeExposure: 'ujat.recruit.volunteer.noticeExposure',
  publicTitle: 'ujat.recruit.volunteer.publicTitle',
  programRange: 'ujat.recruit.volunteer.programRange',
  volunteerTargets: 'ujat.recruit.volunteer.volunteerTargets',
  targetDetail: 'ujat.recruit.volunteer.targetDetail',
  recruitRange: 'ujat.recruit.volunteer.recruitRange',
  recruitRangeH1: 'ujat.recruit.volunteer.h1.recruitRange',
  recruitRangeH2: 'ujat.recruit.volunteer.h2.recruitRange',
  activityTermH1: 'ujat.recruit.volunteer.h1.activityTerm',
  activityTermH2: 'ujat.recruit.volunteer.h2.activityTerm',
  docAnnounce: 'ujat.recruit.volunteer.docAnnounce',
  interviewRange: 'ujat.recruit.volunteer.interviewRange',
  interviewMethod: 'ujat.recruit.volunteer.interviewMethod',
  finalAnnounce: 'ujat.recruit.volunteer.finalAnnounce',
  contact: 'ujat.recruit.volunteer.contact',
  notes: 'ujat.recruit.volunteer.notes',
  description: 'ujat.recruit.volunteer.description',
  recruitmentGuide: 'ujat.recruit.volunteer.recruitmentGuide',
  applicationMethod: 'ujat.recruit.volunteer.applicationMethod',
  otherNotes: 'ujat.recruit.volunteer.otherNotes',
  additionalContentHtml: 'ujat.recruit.volunteer.additionalContentHtml',
  attachmentFileNames: 'ujat.recruit.volunteer.attachmentFileNames',
} as const
