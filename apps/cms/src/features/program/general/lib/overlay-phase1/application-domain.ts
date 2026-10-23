/**
 * 신청 Independent 도메인 계산.
 * overlay store / collect / peek / RHF 를 호출하지 않는다.
 */
import {
  keyMatchesOperationalOverlayPrefixes,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { resolveFormBindingTargetType } from '@/features/program/general/lib/resolve-form-binding-target-type'
import type { OptionalField } from './common-info-form-values'
import { isFieldPresent } from './common-info-form-values'
import { orderOverlayKeys } from './common-info-domain'
import type {
  ApplicationCatalog,
  ApplicationFormValues,
  IndependentApplicationFormBindingIntent,
  IndividualApplicationValues,
  InstitutionApplicationValues,
  InstructorApplicationValues,
  VolunteerApplicationValues,
} from './application-form-values'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'

export const APPLICATION_CATALOG_TARGET_ROLE: Record<ApplicationCatalog, string> = {
  'application-participant-school': 'ORGANIZATION',
  'application-participant-individual': 'INDIVIDUAL',
  'application-instructor': 'INSTRUCTOR',
  'application-volunteer': 'VOLUNTEER',
}

const INSTITUTION = 'application.institution'
const INDIVIDUAL = 'application.individual'
const INSTRUCTOR = 'application.instructor'
const VOLUNTEER = 'application.volunteer'
const INDIVIDUAL_TEAM = `${INDIVIDUAL}.teamInfo`
const VOLUNTEER_PREV = `${VOLUNTEER}.previousProgram`
const VOLUNTEER_APPLICANT = `${VOLUNTEER}.applicant`
const VOLUNTEER_ACTIVITY = `${VOLUNTEER}.activitySchedule`
const VOLUNTEER_INTERVIEW = `${VOLUNTEER}.interview`

export const APPLICATION_OVERLAY_PREFIX = {
  institution: INSTITUTION,
  individual: INDIVIDUAL,
  individualTeam: INDIVIDUAL_TEAM,
  instructor: INSTRUCTOR,
  volunteer: VOLUNTEER,
  volunteerPrevious: VOLUNTEER_PREV,
  volunteerApplicant: VOLUNTEER_APPLICANT,
  volunteerActivity: VOLUNTEER_ACTIVITY,
  volunteerInterview: VOLUNTEER_INTERVIEW,
} as const

export const INSTITUTION_APPLICATION_STATIC_KEYS = {
  teacherTel: `${INSTITUTION}.teacherTel`,
  teacherMobile: `${INSTITUTION}.teacherMobile`,
  teacherEmail: `${INSTITUTION}.teacherEmail`,
  applicationGrade: `${INSTITUTION}.applicationGrade`,
  educationForm: `${INSTITUTION}.educationForm`,
  classCount: `${INSTITUTION}.classCount`,
  preferredSchedules: `${INSTITUTION}.preferredSchedules`,
  fixedScheduleSelected: `${INSTITUTION}.fixedScheduleSelected`,
  guidanceAnswers: `${INSTITUTION}.guidanceAnswers`,
  sexOffenseInquiryMethod: `${INSTITUTION}.sexOffense.inquiryMethod`,
  sexOffenseSiteSubmission: `${INSTITUTION}.sexOffense.siteSubmission`,
  sexOffenseInstitutionId: `${INSTITUTION}.sexOffense.institutionId`,
  sexOffenseVerificationNumber: `${INSTITUTION}.sexOffense.verificationNumber`,
} as const

export const INDIVIDUAL_APPLICATION_STATIC_KEYS = {
  teamName: `${INDIVIDUAL_TEAM}.teamName`,
  memberCountSelect: `${INDIVIDUAL_TEAM}.memberCountSelect`,
  customMemberCount: `${INDIVIDUAL_TEAM}.customMemberCount`,
  teamRole: `${INDIVIDUAL_TEAM}.teamRole`,
  fixedScheduleSelected: `${INDIVIDUAL}.fixedScheduleSelected`,
} as const

export const INSTRUCTOR_APPLICATION_STATIC_KEYS = {
  crimeRecordConfirmed: `${INSTRUCTOR}.crimeRecordConfirmed`,
  currentMonth: `${INSTRUCTOR}.currentMonth`,
  selectedDate: `${INSTRUCTOR}.selectedDate`,
  selectedSlotIds: `${INSTRUCTOR}.selectedSlotIds`,
} as const

export const VOLUNTEER_APPLICATION_STATIC_KEYS = {
  previousProgramYear: `${VOLUNTEER_PREV}.applicationYear`,
  previousProgramName: `${VOLUNTEER_PREV}.programName`,
  previousProgramFileNames: `${VOLUNTEER_PREV}.fileNames`,
  applicantCurrentMonth: `${VOLUNTEER_APPLICANT}.currentMonth`,
  applicantSelectedDate: `${VOLUNTEER_APPLICANT}.selectedDate`,
  applicantSelectedSlots: `${VOLUNTEER_APPLICANT}.selectedSlots`,
  activityCurrentMonth: `${VOLUNTEER_ACTIVITY}.currentMonth`,
  activitySelectedDate: `${VOLUNTEER_ACTIVITY}.selectedDate`,
  activitySelectedSlotIds: `${VOLUNTEER_ACTIVITY}.selectedSlotIds`,
} as const

const VOLUNTEER_EXCEPTION_KEY =
  /^application\.volunteer\.interview\.exception\.([^.]+)\.(.+)$/

export function applicationCatalogPrefixes(catalog: ApplicationCatalog): readonly string[] {
  return operationalOverlayKeyPrefixesForCatalogId(catalog)
}

export function pickApplicationOverlayByCatalog(
  overlay: Record<string, unknown>,
  catalog: ApplicationCatalog
): Record<string, unknown> {
  const prefixes = applicationCatalogPrefixes(catalog)
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) out[key] = value
  }
  return out
}

export function splitIndependentApplicationCatalogOverlays(
  overlay: Record<string, unknown>
): Record<ApplicationCatalog, Record<string, unknown>> {
  return {
    'application-participant-school': pickApplicationOverlayByCatalog(
      overlay,
      'application-participant-school'
    ),
    'application-participant-individual': pickApplicationOverlayByCatalog(
      overlay,
      'application-participant-individual'
    ),
    'application-instructor': pickApplicationOverlayByCatalog(overlay, 'application-instructor'),
    'application-volunteer': pickApplicationOverlayByCatalog(overlay, 'application-volunteer'),
  }
}

export function independentApplicationFormBindingIntent(
  catalog: ApplicationCatalog
): IndependentApplicationFormBindingIntent {
  const targetRole = APPLICATION_CATALOG_TARGET_ROLE[catalog]
  return {
    formType: 'APPLICATION',
    active: true,
    required: false,
    targetRole,
    targetType: resolveFormBindingTargetType(targetRole),
  }
}

function writePresent(
  out: Record<string, unknown>,
  key: string,
  field: OptionalField<unknown> | undefined
): void {
  if (!field || !isFieldPresent(field)) return
  out[key] = field.persist
}

function writeExtraSuffixes(
  out: Record<string, unknown>,
  prefix: string,
  extra: OptionalField<Record<string, unknown>> | undefined
): void {
  if (!extra || !isFieldPresent(extra)) return
  const record = extra.persist
  const source =
    record != null && typeof record === 'object' && !Array.isArray(record)
      ? (record as Record<string, unknown>)
      : extra.value
  for (const [suffix, value] of Object.entries(source)) {
    if (!suffix) continue
    out[`${prefix}.${suffix}`] = value
  }
}

function serializeInstitution(values: InstitutionApplicationValues): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.teacherTel, values.teacherTel)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.teacherMobile, values.teacherMobile)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.teacherEmail, values.teacherEmail)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.applicationGrade, values.applicationGrade)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.educationForm, values.educationForm)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.classCount, values.classCount)
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.preferredSchedules, values.preferredSchedules)
  writePresent(
    out,
    INSTITUTION_APPLICATION_STATIC_KEYS.fixedScheduleSelected,
    values.fixedScheduleSelected
  )
  writePresent(out, INSTITUTION_APPLICATION_STATIC_KEYS.guidanceAnswers, values.guidanceAnswers)
  writePresent(
    out,
    INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseInquiryMethod,
    values.sexOffenseInquiryMethod
  )
  writePresent(
    out,
    INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseSiteSubmission,
    values.sexOffenseSiteSubmission
  )
  writePresent(
    out,
    INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseInstitutionId,
    values.sexOffenseInstitutionId
  )
  writePresent(
    out,
    INSTITUTION_APPLICATION_STATIC_KEYS.sexOffenseVerificationNumber,
    values.sexOffenseVerificationNumber
  )
  writeExtraSuffixes(out, INSTITUTION, values.extraOwned)
  return out
}

function serializeIndividual(values: IndividualApplicationValues): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  writePresent(out, INDIVIDUAL_APPLICATION_STATIC_KEYS.teamName, values.teamName)
  writePresent(out, INDIVIDUAL_APPLICATION_STATIC_KEYS.memberCountSelect, values.memberCountSelect)
  writePresent(out, INDIVIDUAL_APPLICATION_STATIC_KEYS.customMemberCount, values.customMemberCount)
  writePresent(out, INDIVIDUAL_APPLICATION_STATIC_KEYS.teamRole, values.teamRole)
  writePresent(
    out,
    INDIVIDUAL_APPLICATION_STATIC_KEYS.fixedScheduleSelected,
    values.fixedScheduleSelected
  )
  writeExtraSuffixes(out, INDIVIDUAL_TEAM, values.extraTeamInfo)
  writeExtraSuffixes(out, INDIVIDUAL, values.extraOwned)
  return out
}

function serializeInstructor(values: InstructorApplicationValues): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  writePresent(
    out,
    INSTRUCTOR_APPLICATION_STATIC_KEYS.crimeRecordConfirmed,
    values.crimeRecordConfirmed
  )
  writePresent(out, INSTRUCTOR_APPLICATION_STATIC_KEYS.currentMonth, values.currentMonth)
  writePresent(out, INSTRUCTOR_APPLICATION_STATIC_KEYS.selectedDate, values.selectedDate)
  writePresent(out, INSTRUCTOR_APPLICATION_STATIC_KEYS.selectedSlotIds, values.selectedSlotIds)
  writeExtraSuffixes(out, INSTRUCTOR, values.extraOwned)
  return out
}

function serializeVolunteer(values: VolunteerApplicationValues): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  writePresent(out, VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramYear, values.previousProgramYear)
  writePresent(out, VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramName, values.previousProgramName)
  writePresent(
    out,
    VOLUNTEER_APPLICATION_STATIC_KEYS.previousProgramFileNames,
    values.previousProgramFileNames
  )
  writePresent(
    out,
    VOLUNTEER_APPLICATION_STATIC_KEYS.applicantCurrentMonth,
    values.applicantCurrentMonth
  )
  writePresent(
    out,
    VOLUNTEER_APPLICATION_STATIC_KEYS.applicantSelectedDate,
    values.applicantSelectedDate
  )
  writePresent(
    out,
    VOLUNTEER_APPLICATION_STATIC_KEYS.applicantSelectedSlots,
    values.applicantSelectedSlots
  )
  writePresent(out, VOLUNTEER_APPLICATION_STATIC_KEYS.activityCurrentMonth, values.activityCurrentMonth)
  writePresent(out, VOLUNTEER_APPLICATION_STATIC_KEYS.activitySelectedDate, values.activitySelectedDate)
  writePresent(
    out,
    VOLUNTEER_APPLICATION_STATIC_KEYS.activitySelectedSlotIds,
    values.activitySelectedSlotIds
  )
  writeExtraSuffixes(out, VOLUNTEER_ACTIVITY, values.extraActivitySchedule)
  writeExtraSuffixes(out, VOLUNTEER_INTERVIEW, values.interviewFields)
  if (values.interviewExceptions && isFieldPresent(values.interviewExceptions)) {
    for (const block of values.interviewExceptions.value) {
      for (const [suffix, value] of Object.entries(block.fields)) {
        if (!suffix) continue
        out[`${VOLUNTEER_INTERVIEW}.exception.${block.blockId}.${suffix}`] = value
      }
    }
  }
  writeExtraSuffixes(out, VOLUNTEER, values.extraOwned)
  return out
}

export function serializeIndependentApplicationFormValues(
  formValues: ApplicationFormValues
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (formValues.institution) Object.assign(out, serializeInstitution(formValues.institution))
  if (formValues.individual) Object.assign(out, serializeIndividual(formValues.individual))
  if (formValues.instructor) Object.assign(out, serializeInstructor(formValues.instructor))
  if (formValues.volunteer) Object.assign(out, serializeVolunteer(formValues.volunteer))
  return out
}

export function mergeIndependentApplicationLocalOverlay(
  previous: Record<string, unknown> | undefined,
  catalogOverlay: Record<string, unknown>,
  catalog?: ApplicationCatalog
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(previous ?? {}) }
  if (catalog) {
    const prefixes = applicationCatalogPrefixes(catalog)
    for (const key of Object.keys(merged)) {
      if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) delete merged[key]
    }
  }
  return { ...merged, ...catalogOverlay }
}

export function parseVolunteerInterviewExceptionKey(
  key: string
): { blockId: string; suffix: string } | null {
  const match = VOLUNTEER_EXCEPTION_KEY.exec(key)
  if (!match) return null
  return { blockId: match[1] ?? '', suffix: match[2] ?? '' }
}

export const INDEPENDENT_APPLICATION_CATALOGS = APPLICATION_BINDING_CATALOG_IDS

export function orderIndependentApplicationOverlay(
  overlay: Record<string, unknown>,
  keyOrder?: readonly string[]
): Record<string, unknown> {
  return orderOverlayKeys(overlay, keyOrder)
}
