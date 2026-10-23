/**
 * Phase 1-B — 신청 양식 Independent Builder 입력 계약.
 * overlay store / peek / RHF 를 노출하지 않는다.
 * overlay KV prefix 문자열을 RHF 모델로 복제하지 않는다.
 */
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import type { ApplicationBindingCatalogId, ApplicationBindingDraft } from './program-edit-snapshot.types'
import type { OptionalField } from './common-info-form-values'

export type ApplicationCatalog = ApplicationBindingCatalogId

export type InstitutionApplicationValues = {
  teacherTel: OptionalField<string | null>
  teacherMobile: OptionalField<string | null>
  teacherEmail: OptionalField<string | null>
  applicationGrade: OptionalField<string | null>
  educationForm: OptionalField<string | null>
  classCount: OptionalField<string | null>
  preferredSchedules: OptionalField<readonly unknown[]>
  fixedScheduleSelected: OptionalField<readonly unknown[]>
  guidanceAnswers: OptionalField<Record<string, unknown>>
  sexOffenseInquiryMethod: OptionalField<string | null>
  sexOffenseSiteSubmission: OptionalField<string | null>
  sexOffenseInstitutionId: OptionalField<string | null>
  sexOffenseVerificationNumber: OptionalField<string | null>
  extraOwned: OptionalField<Record<string, unknown>>
}

export type IndividualApplicationValues = {
  teamName: OptionalField<string | null>
  memberCountSelect: OptionalField<string | null>
  customMemberCount: OptionalField<string | null>
  teamRole: OptionalField<string | null>
  extraTeamInfo: OptionalField<Record<string, unknown>>
  /** 개인 catalog 정본. 기관 `application.institution.fixedScheduleSelected` 와 섞지 않는다. */
  fixedScheduleSelected: OptionalField<readonly unknown[]>
  extraOwned: OptionalField<Record<string, unknown>>
}

export type InstructorApplicationValues = {
  crimeRecordConfirmed: OptionalField<boolean | string | null>
  currentMonth: OptionalField<string | null>
  selectedDate: OptionalField<string | null>
  selectedSlotIds: OptionalField<readonly unknown[]>
  extraOwned: OptionalField<Record<string, unknown>>
}

export type VolunteerInterviewExceptionValues = {
  blockId: string
  fields: Record<string, unknown>
}

export type VolunteerApplicationValues = {
  previousProgramYear: OptionalField<string | null>
  previousProgramName: OptionalField<string | null>
  previousProgramFileNames: OptionalField<readonly unknown[]>
  applicantCurrentMonth: OptionalField<string | null>
  applicantSelectedDate: OptionalField<string | null>
  applicantSelectedSlots: OptionalField<readonly unknown[]>
  activityCurrentMonth: OptionalField<string | null>
  activitySelectedDate: OptionalField<string | null>
  activitySelectedSlotIds: OptionalField<readonly unknown[]>
  extraActivitySchedule: OptionalField<Record<string, unknown>>
  interviewFields: OptionalField<Record<string, unknown>>
  interviewExceptions: OptionalField<readonly VolunteerInterviewExceptionValues[]>
  extraOwned: OptionalField<Record<string, unknown>>
}

export type ApplicationFormValues = {
  institution?: InstitutionApplicationValues
  individual?: IndividualApplicationValues
  instructor?: InstructorApplicationValues
  volunteer?: VolunteerApplicationValues
}

export type ApplicationSidecars = {
  /** 이 catalog prefix 밖의 KV. 개인 catalog의 institution 일정 키 등 */
  unownedOverlay?: Record<string, unknown>
  overlayKeyOrder?: readonly string[]
  /**
   * 미리보기·브리지 스냅샷 입력. 라이브 브리지 store / Independent extras 가 아니다.
   * 기존 Legacy extras로 만든 값을 그대로 받는다.
   */
  bridge?: InstitutionApplicationProgramBridge
  /** 위저드 임시저장에 이미 있던 overlay. catalog overlay를 이 위에 합친다. */
  previousLocalOverlay?: Record<string, unknown>
}

export type IndependentApplicationFormBindingIntent = {
  formType: 'APPLICATION'
  active: true
  required: false
  targetRole: string
  targetType: string
}

export type IndependentApplicationBuildInput = {
  catalog: ApplicationCatalog
  formValues: ApplicationFormValues
  sidecars?: ApplicationSidecars
}

export type IndependentApplicationBuildResult = ApplicationBindingDraft & {
  formBindingIntent: IndependentApplicationFormBindingIntent
  bridge?: InstitutionApplicationProgramBridge
  localOverlay: Record<string, unknown>
}

export type IndependentApplicationDraftsInput = {
  formValues: ApplicationFormValues
  sidecars?: ApplicationSidecars
  catalogs?: readonly ApplicationCatalog[]
}
