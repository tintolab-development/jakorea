/**
 * Phase 1-B — 모집 Independent Builder 입력 계약.
 * overlay store / peek / RHF 를 노출하지 않는다.
 */
import type { Program } from '@/types/domain'
import type { GeneralProgramVolunteerInterviewScheduleInfo } from '@/types/domain'
import type { MediaSidecarState } from './program-edit-snapshot.types'

export type RecruitRangeSeal = { start: string; end: string }

export type RecruitDetailHtml = {
  programDescription?: string
  recruitmentGuide?: string
  applicationMethod?: string
  learningSupportContent?: string
  additionalContentHtml?: string
  otherNotes?: string
}

export type InstitutionRecruitmentValues = {
  maxAssignableInstructors?: number
  maxClassCount?: number
  maxScheduleCount?: number
  maxSessionsPerDay?: number
  announcementPublished?: boolean
  preguidanceRequired?: boolean
  studentListRequired?: 'required' | 'not_required'
  certificateProvided?: boolean
  recruitRangeSeal?: RecruitRangeSeal
  programRangeSeal?: RecruitRangeSeal
  finalAnnounceIso?: string
  finalAnnounceMethod?: string
  targetLevels?: string[]
  targetLevelDetail?: string
  inquiryContact?: string
  inquiryTel?: string
  inquiryEmail?: string
  notes?: string
  notesNotApplicable?: boolean
  detailHtml?: RecruitDetailHtml
}

export type IndividualRecruitmentValues = {
  recruitRangeSeal?: RecruitRangeSeal
  programRangeSeal?: RecruitRangeSeal
  announcementPublished?: boolean
  targetLevels?: string[]
  targetLevelDetail?: string
  docDeadlineIso?: string
  docAnnounceMethod?: string
  interviewRangeSeal?: RecruitRangeSeal
  interviewMethod?: string
  finalAnnounceIso?: string
  finalAnnounceMethod?: string
  inquiryContact?: string
  inquiryTel?: string
  inquiryEmail?: string
  notes?: string
  notesNotApplicable?: boolean
  detailHtml?: RecruitDetailHtml
}

export type InstructorRecruitmentValues = {
  recruitRangeSeal?: RecruitRangeSeal
  programRangeSeal?: RecruitRangeSeal
  recruitTargets?: string[]
  recruitTargetDetail?: string
  announcementPublished?: boolean
  inquiryContact?: string
  inquiryTel?: string
  inquiryEmail?: string
  notes?: string
  finalAnnounceIso?: string
  finalAnnounceMethod?: string
  detailHtml?: RecruitDetailHtml
}

export type VolunteerInterviewValues = {
  selectedSlotKeys?: string[]
  interviewTimeRange?: unknown
  timeUnit?: unknown
  exclusionState?: {
    excludeNone: boolean
    excludeSaturday: boolean
    excludeSunday: boolean
    excludeHoliday: boolean
  }
  appliedUnavailableDates?: string[]
  exceptions?: GeneralProgramVolunteerInterviewScheduleInfo['exceptions']
}

export type VolunteerRecruitmentValues = {
  recruitRangeSeal?: RecruitRangeSeal
  programRangeSeal?: RecruitRangeSeal
  volunteerTargets?: string[]
  volunteerTargetDetail?: string
  announcementPublished?: boolean
  interviewRequired?: boolean
  docDeadlineIso?: string
  docAnnounceMethod?: string
  interviewRangeSeal?: RecruitRangeSeal
  interviewMethod?: string
  finalAnnounceIso?: string
  finalAnnounceMethod?: string
  inquiryContact?: string
  inquiryTel?: string
  inquiryEmail?: string
  notes?: string
  notesNotApplicable?: boolean
  detailHtml?: RecruitDetailHtml
  interview?: VolunteerInterviewValues
}

export type RecruitmentFormValues = {
  institution?: InstitutionRecruitmentValues
  individual?: IndividualRecruitmentValues
  instructor?: InstructorRecruitmentValues
  volunteer?: VolunteerRecruitmentValues
}

export type RecruitmentSidecars = {
  unownedOverlay?: Record<string, unknown>
  overlayKeyOrder?: readonly string[]
  /** 기존 fileObjectId sidecar. 이번 단계에서 독립 구현하지 않고 통과만 한다. */
  media?: MediaSidecarState
  preferOverlay?: boolean
}

export type IndependentRecruitmentBuildMode = 'create' | 'update'

export type IndependentRecruitmentBuildInput = {
  formValues: RecruitmentFormValues
  sidecars?: RecruitmentSidecars
  baseline: Program
  mode: IndependentRecruitmentBuildMode
  catalogOverlays?: Partial<
    Record<
      | 'recruitment-participant-school'
      | 'recruitment-participant-individual'
      | 'recruitment-instructor'
      | 'recruitment-volunteer',
      Record<string, unknown>
    >
  >
}

export type IndependentRecruitmentBuildResult = {
  programDraft: Program
  persistOverlay: Record<string, unknown>
  catalogOverlays: Record<string, Record<string, unknown>>
}
