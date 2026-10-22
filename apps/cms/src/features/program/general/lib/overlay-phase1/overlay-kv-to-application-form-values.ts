/**
 * 테스트 전용 입력 어댑터. overlay KV → ApplicationFormValues.
 * 프로덕션 Builder는 이 모듈을 import하지 않는다.
 */
import { FIELD_ABSENT, presentField, type OptionalField } from './common-info-form-values'
import {
  APPLICATION_OVERLAY_PREFIX as P,
  INDIVIDUAL_APPLICATION_STATIC_KEYS,
  INSTITUTION_APPLICATION_STATIC_KEYS,
  INSTRUCTOR_APPLICATION_STATIC_KEYS,
  parseVolunteerInterviewExceptionKey,
  pickApplicationOverlayByCatalog,
  VOLUNTEER_APPLICATION_STATIC_KEYS,
} from './application-domain'
import type {
  ApplicationFormValues,
  ApplicationSidecars,
  IndividualApplicationValues,
  InstitutionApplicationValues,
  InstructorApplicationValues,
  VolunteerApplicationValues,
  VolunteerInterviewExceptionValues,
} from './application-form-values'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'

function hasOwn(overlay: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(overlay, key)
}

function fieldFromKey<T>(
  overlay: Record<string, unknown>,
  key: string,
  mapValue: (raw: unknown) => T
): OptionalField<T> {
  if (!hasOwn(overlay, key)) return FIELD_ABSENT
  const raw = overlay[key]
  return presentField(mapValue(raw), raw)
}

function asStringOrNull(raw: unknown): string | null {
  if (raw == null) return null
  return typeof raw === 'string' ? raw : String(raw)
}

function asArray(raw: unknown): readonly unknown[] {
  return Array.isArray(raw) ? raw : []
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

function stripPrefix(key: string, prefix: string): string | null {
  if (key === prefix) return ''
  const needle = `${prefix}.`
  if (!key.startsWith(needle)) return null
  return key.slice(needle.length)
}

function extraOwnedFromKeys(
  overlay: Record<string, unknown>,
  prefix: string,
  reserved: ReadonlySet<string>
): OptionalField<Record<string, unknown>> {
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    const suffix = stripPrefix(key, prefix)
    if (suffix == null || suffix === '') continue
    if (reserved.has(key)) continue
    extra[suffix] = value
  }
  if (Object.keys(extra).length === 0) return FIELD_ABSENT
  return presentField(extra, extra)
}

const INSTITUTION_RESERVED = new Set<string>(Object.values(INSTITUTION_APPLICATION_STATIC_KEYS))
const INDIVIDUAL_TEAM_RESERVED = new Set<string>(Object.values(INDIVIDUAL_APPLICATION_STATIC_KEYS))
const INSTRUCTOR_RESERVED = new Set<string>(Object.values(INSTRUCTOR_APPLICATION_STATIC_KEYS))
const VOLUNTEER_STATIC_RESERVED = new Set<string>(Object.values(VOLUNTEER_APPLICATION_STATIC_KEYS))

function readInstitution(overlay: Record<string, unknown>): InstitutionApplicationValues | undefined {
  const scoped = pickApplicationOverlayByCatalog(overlay, 'application-participant-school')
  if (Object.keys(scoped).length === 0) return undefined
  return {
    teacherTel: fieldFromKey(scoped, INSTITUTION_APPLICATION_STATIC_KEYS.teacherTel, asStringOrNull),
    teacherMobile: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.teacherMobile,
      asStringOrNull
    ),
    teacherEmail: fieldFromKey(scoped, INSTITUTION_APPLICATION_STATIC_KEYS.teacherEmail, asStringOrNull),
    applicationGrade: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.applicationGrade,
      asStringOrNull
    ),
    educationForm: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.educationForm,
      asStringOrNull
    ),
    classCount: fieldFromKey(scoped, INSTITUTION_APPLICATION_STATIC_KEYS.classCount, asStringOrNull),
    preferredSchedules: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.preferredSchedules,
      asArray
    ),
    fixedScheduleSelected: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.fixedScheduleSelected,
      asArray
    ),
    guidanceAnswers: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.guidanceAnswers,
      asRecord
    ),
    sexOffenseInquiryMethod: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseInquiryMethod,
      asStringOrNull
    ),
    sexOffenseSiteSubmission: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseSiteSubmission,
      asStringOrNull
    ),
    sexOffenseInstitutionId: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseInstitutionId,
      asStringOrNull
    ),
    sexOffenseVerificationNumber: fieldFromKey(
      scoped,
      INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseVerificationNumber,
      asStringOrNull
    ),
    extraOwned: extraOwnedFromKeys(scoped, P.institution, INSTITUTION_RESERVED),
  }
}

function readIndividual(overlay: Record<string, unknown>): IndividualApplicationValues | undefined {
  const scoped = pickApplicationOverlayByCatalog(overlay, 'application-participant-individual')
  if (Object.keys(scoped).length === 0) return undefined
  const extraTeam = extraOwnedFromKeys(scoped, P.individualTeam, INDIVIDUAL_TEAM_RESERVED)
  const reserved = new Set<string>([
    ...INDIVIDUAL_TEAM_RESERVED,
    ...Object.keys(scoped).filter(key => key.startsWith(`${P.individualTeam}.`)),
  ])
  return {
    teamName: fieldFromKey(scoped, INDIVIDUAL_APPLICATION_STATIC_KEYS.teamName, asStringOrNull),
    memberCountSelect: fieldFromKey(
      scoped,
      INDIVIDUAL_APPLICATION_STATIC_KEYS.memberCountSelect,
      asStringOrNull
    ),
    customMemberCount: fieldFromKey(
      scoped,
      INDIVIDUAL_APPLICATION_STATIC_KEYS.customMemberCount,
      asStringOrNull
    ),
    teamRole: fieldFromKey(scoped, INDIVIDUAL_APPLICATION_STATIC_KEYS.teamRole, asStringOrNull),
    extraTeamInfo: extraTeam,
    extraOwned: extraOwnedFromKeys(scoped, P.individual, reserved),
  }
}

function readInstructor(overlay: Record<string, unknown>): InstructorApplicationValues | undefined {
  const scoped = pickApplicationOverlayByCatalog(overlay, 'application-instructor')
  if (Object.keys(scoped).length === 0) return undefined
  return {
    crimeRecordConfirmed: fieldFromKey(
      scoped,
      INSTRUCTOR_APPLICATION_STATIC_KEYS.crimeRecordConfirmed,
      raw => (typeof raw === 'boolean' || typeof raw === 'string' ? raw : raw == null ? null : Boolean(raw))
    ),
    currentMonth: fieldFromKey(
      scoped,
      INSTRUCTOR_APPLICATION_STATIC_KEYS.currentMonth,
      asStringOrNull
    ),
    selectedDate: fieldFromKey(scoped, INSTRUCTOR_APPLICATION_STATIC_KEYS.selectedDate, asStringOrNull),
    selectedSlotIds: fieldFromKey(
      scoped,
      INSTRUCTOR_APPLICATION_STATIC_KEYS.selectedSlotIds,
      asArray
    ),
    extraOwned: extraOwnedFromKeys(scoped, P.instructor, INSTRUCTOR_RESERVED),
  }
}

function readVolunteer(overlay: Record<string, unknown>): VolunteerApplicationValues | undefined {
  const scoped = pickApplicationOverlayByCatalog(overlay, 'application-volunteer')
  if (Object.keys(scoped).length === 0) return undefined

  const exceptionsById = new Map<string, VolunteerInterviewExceptionValues>()
  const exceptionOrder: string[] = []
  const interviewFields: Record<string, unknown> = {}
  const extraActivity: Record<string, unknown> = {}
  const extraOwned: Record<string, unknown> = {}
  const nestedReservedPrefixes = [
    `${P.volunteerPrevious}.`,
    `${P.volunteerApplicant}.`,
    `${P.volunteerActivity}.`,
    `${P.volunteerInterview}.`,
  ]

  for (const [key, value] of Object.entries(scoped)) {
    if (VOLUNTEER_STATIC_RESERVED.has(key)) continue
    const exception = parseVolunteerInterviewExceptionKey(key)
    if (exception) {
      let block = exceptionsById.get(exception.blockId)
      if (!block) {
        block = { blockId: exception.blockId, fields: {} }
        exceptionsById.set(exception.blockId, block)
        exceptionOrder.push(exception.blockId)
      }
      block.fields[exception.suffix] = value
      continue
    }
    const interviewSuffix = stripPrefix(key, P.volunteerInterview)
    if (interviewSuffix != null && interviewSuffix !== '') {
      interviewFields[interviewSuffix] = value
      continue
    }
    const activitySuffix = stripPrefix(key, P.volunteerActivity)
    if (activitySuffix != null && activitySuffix !== '') {
      extraActivity[activitySuffix] = value
      continue
    }
    if (nestedReservedPrefixes.some(prefix => key.startsWith(prefix))) continue
    const volunteerSuffix = stripPrefix(key, P.volunteer)
    if (volunteerSuffix != null && volunteerSuffix !== '') extraOwned[volunteerSuffix] = value
  }

  const exceptions = exceptionOrder.map(id => exceptionsById.get(id)!).filter(Boolean)

  return {
    previousProgramYear: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramYear,
      asStringOrNull
    ),
    previousProgramName: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramName,
      asStringOrNull
    ),
    previousProgramFileNames: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramFileNames,
      asArray
    ),
    applicantCurrentMonth: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.applicantCurrentMonth,
      asStringOrNull
    ),
    applicantSelectedDate: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.applicantSelectedDate,
      asStringOrNull
    ),
    applicantSelectedSlots: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.applicantSelectedSlots,
      asArray
    ),
    activityCurrentMonth: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.activityCurrentMonth,
      asStringOrNull
    ),
    activitySelectedDate: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.activitySelectedDate,
      asStringOrNull
    ),
    activitySelectedSlotIds: fieldFromKey(
      scoped,
      VOLUNTEER_APPLICATION_STATIC_KEYS.activitySelectedSlotIds,
      asArray
    ),
    extraActivitySchedule:
      Object.keys(extraActivity).length > 0 ? presentField(extraActivity, extraActivity) : FIELD_ABSENT,
    interviewFields:
      Object.keys(interviewFields).length > 0
        ? presentField(interviewFields, interviewFields)
        : FIELD_ABSENT,
    interviewExceptions:
      exceptions.length > 0 ? presentField(exceptions, exceptions) : FIELD_ABSENT,
    extraOwned: Object.keys(extraOwned).length > 0 ? presentField(extraOwned, extraOwned) : FIELD_ABSENT,
  }
}

function unownedOverlayFrom(overlay: Record<string, unknown>): Record<string, unknown> {
  const owned = new Set<string>()
  for (const catalog of APPLICATION_BINDING_CATALOG_IDS) {
    for (const key of Object.keys(pickApplicationOverlayByCatalog(overlay, catalog))) {
      owned.add(key)
    }
  }
  const unowned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (!owned.has(key)) unowned[key] = value
  }
  return unowned
}

export function overlayKvToIndependentApplicationInput(
  overlay: Record<string, unknown>
): { formValues: ApplicationFormValues; sidecars: ApplicationSidecars } {
  return {
    formValues: {
      institution: readInstitution(overlay),
      individual: readIndividual(overlay),
      instructor: readInstructor(overlay),
      volunteer: readVolunteer(overlay),
    },
    sidecars: {
      unownedOverlay: unownedOverlayFrom(overlay),
      overlayKeyOrder: Object.keys(overlay),
    },
  }
}

