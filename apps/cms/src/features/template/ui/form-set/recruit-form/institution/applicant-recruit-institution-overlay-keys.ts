/**
 * 기관 모집 overlay 저장 키 이름(값·스토어 아님). 스토어 모듈 없이 키만 필요한 곳에서 쓴다.
 */
export const APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS = {
  maxAssignableInstructors: 'recruit.maxAssignableInstructors',
  maxClassCount: 'recruit.maxClassCount',
  maxScheduleCount: 'recruit.maxScheduleCount',
  maxSessionsPerDay: 'recruit.maxSessionsPerDay',
  announcementPublished: 'recruit.announcementPublished',
  preguidanceRequired: 'recruit.preguidanceRequired',
  studentListRequired: 'recruit.studentListRequired',
  certificateProvided: 'recruit.certificateProvided',
  programAnchorIso: 'recruit.programAnchorIso',
  programRangeSeal: 'recruit.programRangeSeal',
  recruitAnchorIso: 'recruit.recruitAnchorIso',
  recruitRangeSeal: 'recruit.recruitRangeSeal',
  finalAnnounceIso: 'recruit.finalAnnounceIso',
  finalAnnounceMethod: 'recruit.finalAnnounceMethod',
  targetLevels: 'recruit.targetLevels',
  targetLevelDetail: 'recruit.targetLevelDetail',
  inquiryContact: 'recruit.inquiryContact',
  inquiryTel: 'recruit.inquiryTel',
  inquiryEmail: 'recruit.inquiryEmail',
  notesNotApplicable: 'recruit.notesNotApplicable',
  notes: 'recruit.notes',
} as const
