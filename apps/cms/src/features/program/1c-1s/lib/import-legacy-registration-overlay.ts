/**
 * Legacy economyRegistration Overlay → Canonical 1회 import.
 * 정상 신규 등록 persist 는 이 모듈을 읽지 않는다.
 */
import {
  surveyMenuKeysFromRegistrationOverlay,
} from '@/features/program/general/lib/general-survey-menu-keys'
import {
  COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION,
  type CompanySchoolCurriculumSession,
  type CompanySchoolDateRange,
  type CompanySchoolRegistrationCanonical,
  type CompanySchoolRegistrationCommonCanonical,
} from './registration-canonical-types'
import {
  COMPANY_SCHOOL_FIXED_CURRICULUM_SESSIONS,
  COMPANY_SCHOOL_UNSELECTED,
  createDefaultCompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'
import { importLegacyCompanySchoolRecruitmentOverlay } from './registration-rhf-recruitment'
import { importLegacyCompanySchoolApplicationOverlay } from './registration-rhf-application'

function hasOwn(overlay: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(overlay, key)
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asNullableNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asSponsorId(value: unknown): string {
  const id = asString(value).trim()
  return !id || id === COMPANY_SCHOOL_UNSELECTED ? '' : id
}

function asContactIds(overlay: Record<string, unknown>): string[] {
  if (hasOwn(overlay, 'economyRegistration.basicInfo.managerContactIds')) {
    const raw = overlay['economyRegistration.basicInfo.managerContactIds']
    if (Array.isArray(raw)) {
      return [
        ...new Set(
          raw
            .map(item => String(item).trim())
            .filter(id => id && id !== COMPANY_SCHOOL_UNSELECTED)
        ),
      ]
    }
    return []
  }
  if (hasOwn(overlay, 'economyRegistration.basicInfo.managerContactId')) {
    const id = asSponsorId(overlay['economyRegistration.basicInfo.managerContactId'])
    return id ? [id] : []
  }
  return []
}

function asDateRange(value: unknown): CompanySchoolDateRange | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  const start = (value as { start?: unknown }).start
  const end = (value as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  return { start, end }
}

function readText(
  overlay: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  if (!hasOwn(overlay, key)) return fallback
  return asString(overlay[key])
}

function readSession(
  overlay: Record<string, unknown>,
  index: 1 | 2
): CompanySchoolCurriculumSession {
  const fallback = COMPANY_SCHOOL_FIXED_CURRICULUM_SESSIONS[index - 1]
  const titleKey = `economyRegistration.educationCurriculum.session${index}.title`
  const descriptionKey = `economyRegistration.educationCurriculum.session${index}.description`
  return {
    sessionLabel: fallback.sessionLabel,
    title: readText(overlay, titleKey, fallback.title),
    description: readText(overlay, descriptionKey, fallback.description),
  }
}

function extractCommon(
  overlay: Record<string, unknown>
): CompanySchoolRegistrationCommonCanonical {
  const defaults = createDefaultCompanySchoolRegistrationRhfValues()
  return {
    repKo: readText(overlay, 'economyRegistration.basicInfo.repKo', defaults.repKo),
    repEn: readText(overlay, 'economyRegistration.basicInfo.repEn', defaults.repEn),
    publicProgramTitle: readText(
      overlay,
      'economyRegistration.basicInfo.publicProgramTitle',
      ''
    ),
    detailedProgramId: readText(overlay, 'economyRegistration.basicInfo.detailedProgramId', ''),
    detailedProgramName: readText(
      overlay,
      'economyRegistration.basicInfo.detailedProgramName',
      ''
    ),
    operationRange: hasOwn(overlay, 'economyRegistration.basicInfo.operationRangeSeal')
      ? asDateRange(overlay['economyRegistration.basicInfo.operationRangeSeal'])
      : null,
    businessField: readText(
      overlay,
      'economyRegistration.basicInfo.businessField',
      defaults.businessField
    ),
    sponsorId: hasOwn(overlay, 'economyRegistration.basicInfo.sponsorId')
      ? asSponsorId(overlay['economyRegistration.basicInfo.sponsorId'])
      : '',
    managerContactIds: asContactIds(overlay),
    ipOwned: readText(overlay, 'economyRegistration.basicInfo.ipOwned', defaults.ipOwned),
    courseDeliveredBy: readText(
      overlay,
      'economyRegistration.basicInfo.courseDeliveredBy',
      defaults.courseDeliveredBy
    ),
    partnerInvolvement:
      overlay['economyRegistration.basicInfo.partnerInvolvement'] === 'yes' ? 'yes' : 'no',
    ipsCategory: readText(
      overlay,
      'economyRegistration.basicInfo.ipsCategory',
      defaults.ipsCategory
    ),
    educationCourse: readText(
      overlay,
      'economyRegistration.basicInfo.educationCourse',
      defaults.educationCourse
    ),
    participantCount: hasOwn(overlay, 'economyRegistration.kpi.participantCount')
      ? asNullableNumber(overlay['economyRegistration.kpi.participantCount'])
      : null,
    instructor: hasOwn(overlay, 'economyRegistration.kpi.instructor')
      ? asNullableNumber(overlay['economyRegistration.kpi.instructor'])
      : null,
    dispatchedSchool: hasOwn(overlay, 'economyRegistration.kpi.dispatchedSchool')
      ? asNullableNumber(overlay['economyRegistration.kpi.dispatchedSchool'])
      : null,
    dispatchedClass: hasOwn(overlay, 'economyRegistration.kpi.dispatchedClass')
      ? asNullableNumber(overlay['economyRegistration.kpi.dispatchedClass'])
      : null,
    grade1Fee: hasOwn(overlay, 'economyRegistration.wageInfo.grade1Fee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade1Fee'])
      : null,
    grade1DistanceFee: hasOwn(overlay, 'economyRegistration.wageInfo.grade1DistanceFee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade1DistanceFee'])
      : null,
    grade2Fee: hasOwn(overlay, 'economyRegistration.wageInfo.grade2Fee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade2Fee'])
      : null,
    grade2DistanceFee: hasOwn(overlay, 'economyRegistration.wageInfo.grade2DistanceFee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade2DistanceFee'])
      : null,
    grade3Fee: hasOwn(overlay, 'economyRegistration.wageInfo.grade3Fee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade3Fee'])
      : null,
    grade3DistanceFee: hasOwn(overlay, 'economyRegistration.wageInfo.grade3DistanceFee')
      ? asNullableNumber(overlay['economyRegistration.wageInfo.grade3DistanceFee'])
      : null,
    paymentItemValues: hasOwn(overlay, 'economyRegistration.wageInfo.paymentItemValues')
      ? Array.isArray(overlay['economyRegistration.wageInfo.paymentItemValues'])
        ? overlay['economyRegistration.wageInfo.paymentItemValues'].map(String)
        : []
      : undefined,
    curriculumSessions: [readSession(overlay, 1), readSession(overlay, 2)],
    educationScheduleRange: hasOwn(
      overlay,
      'economyRegistration.educationScheduleSettings.dateRangeSeal'
    )
      ? asDateRange(overlay['economyRegistration.educationScheduleSettings.dateRangeSeal'])
      : null,
    educationScheduleMode: 'period',
    educationScheduleLines: [],
    generalSurveyMenuKeys: hasOwn(overlay, 'economyRegistration.basicInfo.surveyItems')
      ? (surveyMenuKeysFromRegistrationOverlay(overlay) ?? [])
      : defaults.generalSurveyMenuKeys,
  }
}

export function importLegacyOverlayToCompanySchoolCanonical(args: {
  overlay?: Record<string, unknown>
}): CompanySchoolRegistrationCanonical {
  const overlay = args.overlay ?? {}
  return {
    schemaVersion: COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION,
    common: extractCommon(overlay),
    recruit: importLegacyCompanySchoolRecruitmentOverlay(overlay),
    application: importLegacyCompanySchoolApplicationOverlay(overlay),
  }
}
