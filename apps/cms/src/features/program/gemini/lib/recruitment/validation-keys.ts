/** QA-0390: 등록 위저드 미입력 강조 키 (Gemini 참여 기관 모집 정보 필드의 `validationKey`) */
export const GEMINI_RECRUITMENT_VALIDATION_KEYS = {
  announcementPublished: 'gemini.recruit.announcementPublished',
  title: 'gemini.recruit.title',
  educationTargetLevels: 'gemini.recruit.educationTargetLevels',
  educationTargetDetail: 'gemini.recruit.educationTargetDetail',
  applicationPeriod: 'gemini.recruit.applicationPeriod',
  trainingRequestPeriod: 'gemini.recruit.trainingRequestPeriod',
  minStudentCount: 'gemini.recruit.minStudentCount',
  educationForm: 'gemini.recruit.educationForm',
  inquiry: 'gemini.recruit.inquiry',
  notes: 'gemini.recruit.notes',
} as const
