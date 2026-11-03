/**
 * 1사1교 신규 등록 공통정보 — Overlay가 아닌 typed canonical snapshot.
 * 신규 저장·필수검사·CREATE 의 정본. Legacy overlay 는 importer 전용.
 */
import type { GeneralProgramSurveyMenuKey } from '@/types/domain'

export const COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION = 1 as const

export type CompanySchoolDateRange = {
  start: string
  end: string
}

export type CompanySchoolCurriculumSession = {
  sessionLabel: string
  title: string
  description: string
}

export type CompanySchoolRegistrationCommonCanonical = {
  repKo: string
  repEn: string
  publicProgramTitle: string
  detailedProgramId: string
  detailedProgramName: string
  operationRange: CompanySchoolDateRange | null
  /** 운영기간 날짜 picker 앵커(C5). 구버전 임시저장본에는 없을 수 있다. */
  operationAnchorIso?: string | null
  businessField: string
  sponsorId: string
  managerContactIds: string[]
  ipOwned: string
  courseDeliveredBy: string
  partnerInvolvement: 'yes' | 'no' | ''
  ipsCategory: string
  educationCourse: string
  participantCount: number | null
  instructor: number | null
  dispatchedSchool: number | null
  dispatchedClass: number | null
  grade1Fee: number | null
  grade1DistanceFee: number | null
  grade2Fee: number | null
  grade2DistanceFee: number | null
  grade3Fee: number | null
  grade3DistanceFee: number | null
  paymentItemValues?: string[]
  curriculumSessions: CompanySchoolCurriculumSession[]
  educationScheduleRange: CompanySchoolDateRange | null
  educationScheduleMode: 'period'
  educationScheduleLines: string[]
  generalSurveyMenuKeys: GeneralProgramSurveyMenuKey[]
}

export type CompanySchoolRecruitRange = {
  start: string
  end: string
}

export type CompanySchoolRecruitDetailInfo = {
  programDescription: string
  recruitmentGuide: string
  applicationMethod: string
  learningSupportContent: string
  additionalContentHtml: string
  thumbFileObjectId: number | null
  attachmentFileObjectIds: number[]
  thumbFileName: string
  thumbContentUrl: string
  attachmentFileNames: string[]
}

export type CompanySchoolInstructorRecruitFormState = {
  programRange: CompanySchoolRecruitRange | null
  recruitRange: CompanySchoolRecruitRange | null
  recruitTargets: string[]
  recruitTargetDetail: string
  /** 미조작은 undefined(화면 기본 게시). 명시적 빈 문자열은 미선택. */
  announcementPublished: string | undefined
  inquiryContact: string
  inquiryTel: string
  inquiryEmail: string
  notes: string
  notesNotApplicable: boolean | undefined
  otherNotes: string
  finalAnnounce: string | null
  finalAnnounceMethod: string
  programAnchorIso: string | null
  recruitAnchorIso: string | null
  detailInfo: CompanySchoolRecruitDetailInfo
}

export type CompanySchoolRecruitFormState = {
  programRange: CompanySchoolRecruitRange | null
  recruitRange: CompanySchoolRecruitRange | null
  finalAnnounce: string | null
  finalAnnounceMethod: string
  maxAssignableInstructors: number | null
  maxClassCount: number | null
  maxScheduleCount: number | null
  maxSessionsPerDay: number | null
  targetLevels: string[]
  targetLevelDetail: string
  inquiryContact: string
  inquiryTel: string
  inquiryEmail: string
  announcementPublished: string
  preguidanceRequired: string
  studentListRequired: string
  certificateProvided: string
  notes: string
  notesNotApplicable: boolean
  detailInfo: CompanySchoolRecruitDetailInfo
  programAnchorIso: string | null
  recruitAnchorIso: string | null
}

export type CompanySchoolApplicationBasicInfo = {
  applicationGrade: string
  classCount: string
  totalStudents: string
  educationFormat: string
  educationPlace: string
  educationPlaceDetail: string
  detailAddress: string
  teacherTel: string
  teacherMobile: string
  teacherEmail: string
  applicationReason: string
  otherRequests: string
}

export type CompanySchoolApplicationGuidanceAnswers = {
  'computer-in-room': string
  'waiting-place': string
  meal: string
  'other-notes': string
}

export type CompanySchoolApplicationLessonReply = {
  companyType: 'partner' | 'none' | 'custom' | ''
  customCompanyName: string
}

export type CompanySchoolPreferredScheduleBlock = {
  date: string | null
  session: '1' | '2' | ''
  firstClassPeriod: string
  firstStart: string | null
  firstEnd: string | null
  secondClassPeriod: string
  secondStart: string | null
  secondEnd: string | null
}

export type CompanySchoolApplicationFormState = {
  basicInfo: CompanySchoolApplicationBasicInfo
  guidanceAnswers: CompanySchoolApplicationGuidanceAnswers
  lessonReply: CompanySchoolApplicationLessonReply
  previousYearParticipation: 'yes' | 'no' | ''
  schedule: {
    first: CompanySchoolPreferredScheduleBlock
    second: CompanySchoolPreferredScheduleBlock
  }
}

export type CompanySchoolRegistrationCanonical = {
  schemaVersion: typeof COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION
  common: CompanySchoolRegistrationCommonCanonical
  recruit?: CompanySchoolRecruitFormState
  instructorRecruit?: CompanySchoolInstructorRecruitFormState
  application?: CompanySchoolApplicationFormState
  /** UNMAPPED_FIELD — 공통정보 whitelist 밖 legacy overlay 키. overlay store가 아니다. */
  sidecar?: Record<string, unknown>
}

export const COMPANY_SCHOOL_REGISTRATION_SETTINGS_KEY =
  'companySchoolRegistrationCanonical' as const

export const COMPANY_SCHOOL_RECRUIT_EDITOR_KIND = 'companySchoolRecruitCanonical' as const

export const COMPANY_SCHOOL_INSTRUCTOR_RECRUIT_EDITOR_KIND =
  'companySchoolInstructorRecruitCanonical' as const

export const COMPANY_SCHOOL_APPLICATION_EDITOR_KIND = 'companySchoolApplicationCanonical' as const
