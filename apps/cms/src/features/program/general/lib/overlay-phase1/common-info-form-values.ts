/**
 * Phase 1-B — 공통정보 독립 Builder 입력 계약.
 * overlay KV / scoped store / RHF 인스턴스를 노출하지 않는다.
 */
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import type { Program } from '@/types/domain'
import type { ProgramRegistrationIpsTypeValue } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import type { ProgramRegistrationMultiRoundAssignmentValue } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-multi-round-assignment-fields'

export type FieldAbsent = { present: false }
export type FieldPresent<T> = { present: true; value: T; persist: unknown }
export type OptionalField<T> = FieldAbsent | FieldPresent<T>

export const FIELD_ABSENT: FieldAbsent = { present: false }

export function presentField<T>(value: T, persist: unknown = value): FieldPresent<T> {
  return { present: true, value, persist }
}

export function isFieldPresent<T>(field: OptionalField<T>): field is FieldPresent<T> {
  return field.present
}

export type CommonInfoIpsValue = ProgramRegistrationIpsTypeValue
export type CommonInfoAssignmentValue = ProgramRegistrationMultiRoundAssignmentValue

export type CommonInfoCurriculumMaps = {
  unitNameBySession: Record<number, string>
  unitContentBySession: Record<number, string>
  progressSessionByRound: Record<number, string>
  roundContentByRound: Record<number, string>
  educationFormBySession: Record<number, string>
  participationBySession: Record<number, string>
  ipsBySession: Record<number, CommonInfoIpsValue>
  assignmentByRound: Record<number, CommonInfoAssignmentValue>
  preEducationScheduleName: string
  preEducationScheduleLine: string
  teacherTrainingEducationForm: string
}

export type CommonInfoScheduleMaps = {
  eventNameByDetail: Record<number, string>
  scheduleDateByDetailIso: Record<number, string | null>
  groupTimesByDetail: Record<number, Array<{ startTime?: string; endTime?: string } | null>>
  educationFormByDetail: Record<number, string>
  participationByDetail: Record<number, string>
  ipsByDetailIndex: Record<number, CommonInfoIpsValue>
  assignmentByDetail: Record<number, { enabled?: boolean; period?: string }>
  preEducationName: string
}

export type CommonInfoSurveyItems = {
  survey?: boolean
  satisfaction?: boolean
  lecture_evaluation?: boolean
}

/** RHF가 앞으로 직접 줄 공통정보 값. overlay KV 타입이 아니다. */
export type CommonInfoFormValues = {
  programTitleKo: OptionalField<string>
  programTitleEn: OptionalField<string>
  publicProgramTitle: OptionalField<string>
  detailedProgramId: OptionalField<string>
  detailedProgramName: OptionalField<string>
  businessField: OptionalField<string>
  partnerInvolvement: OptionalField<string>
  educationVenueKind: OptionalField<string>
  educationVenueDetail: OptionalField<string>
  educationCourse: OptionalField<string>
  ipOwned: OptionalField<string>
  courseDeliveredBy: OptionalField<string>
  operationRangeSeal: OptionalField<{ start: string; end: string } | null>
  surveyItems: OptionalField<CommonInfoSurveyItems>
  sponsorIds: OptionalField<string[]>
  sponsorId: OptionalField<string>
  managerContactIds: OptionalField<string[]>
  managerContactId: OptionalField<string>
  sponsorManagerLine: OptionalField<string>
  kpiParticipantCount: OptionalField<number | null>
  kpiInstructor: OptionalField<number | null>
  kpiVolunteer: OptionalField<number | null>
  kpiDispatchedSchool: OptionalField<number | null>
  kpiDispatchedClass: OptionalField<number | null>
  wageGrade1Fee: OptionalField<number | undefined>
  wageGrade2Fee: OptionalField<number | undefined>
  wageGrade3Fee: OptionalField<number | undefined>
  paymentItemValues: OptionalField<string[]>
  paymentItemLabels: OptionalField<string>
  singleEducationForm: OptionalField<string>
  multiCommonEducationForm: OptionalField<string>
  legacyEducationForm: OptionalField<string>
  singleParticipation: OptionalField<string>
  multiCommonParticipation: OptionalField<string>
  ipsType: OptionalField<CommonInfoIpsValue>
  scheduleLines: OptionalField<string[]>
  curriculum: CommonInfoCurriculumMaps
  schedule: CommonInfoScheduleMaps
}

export type CommonInfoSidecars = {
  /** formValues가 소유하지 않는 KV. 모집·신청·미디어 등은 후속 단계. */
  unownedOverlay?: Record<string, unknown>
  /** persist JSON 키 순서 보존. 값은 쓰지 않고 순서만 사용한다. */
  overlayKeyOrder?: readonly string[]
}

export type IndependentCommonInfoBuildMode = 'create' | 'update'

/**
 * nested 배열 작성 의도. 미설정(omit) / 명시적 삭제(clear) / 교체(replace)를 구분한다.
 * maps는 위저드 overlay 형태 입력. nested가 있으면 stale maps로 개수를 늘리지 않는다.
 */
export type IndependentNestedArrayIntent<T> =
  | { kind: 'omit' }
  | { kind: 'clear' }
  | { kind: 'replace'; value: T[] }
  | { kind: 'maps'; sessionNos?: number[] }

export type IndependentSessionAuthoring = {
  curriculum?: IndependentNestedArrayIntent<import('@/types/domain').GeneralProgramCurriculumSessionRow>
  schedule?: IndependentNestedArrayIntent<import('@/types/domain').GeneralProgramScheduleDetailRow>
}

export type IndependentCommonInfoBuildInput = {
  formValues: CommonInfoFormValues
  editorExtras: GeneralRegistrationEditorExtras
  sidecars?: CommonInfoSidecars
  baseline: Program
  mode: IndependentCommonInfoBuildMode
  sessionAuthoring?: IndependentSessionAuthoring
}

export type IndependentCommonInfoBuildResult = {
  /** apply()와 동일 — extras 컬럼 반영 전 */
  applied: Program
  /** 저장 draft — extras.programType / sessionRoundType 컬럼 포함 */
  programDraft: Program
  persistOverlay: Record<string, unknown>
}
