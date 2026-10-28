import type { DefaultValues } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UJAT_SURVEY_ITEMS_DEFAULT } from './ujat-registration-basic-info-defaults'
import { readUjatSurveyItems } from './registration-survey-items'
import { ujatKpiWageCapacityFromLegacyOverlay } from './ujat-kpi-wage-capacity-typed'
import { EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER } from './ujat-region-capacity-types'

export type UjatBasicInfoFormValues = ProgramDetailEditFormValues

export function stripUjatBasicInfoOverlay(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !key.startsWith('ujat.basicInfo.'))
  )
}

const EMPTY_RANGE = { start: '', end: '' }

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function canonicalSelectValue(
  value: unknown,
  fallback?: 'JA' | 'Partner' | 'Jointly'
): string | undefined {
  const normalized = text(value).trim().toLowerCase()
  if (normalized === 'ja') return 'JA'
  if (normalized === 'partner') return 'Partner'
  if (normalized === 'jointly' || normalized === 'joint') return 'Jointly'
  return fallback
}

function operationRangeFromOverlay(overlay: Record<string, unknown>) {
  const raw = overlay['ujat.basicInfo.operationRangeSeal']
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_RANGE
  const range = raw as { start?: unknown; end?: unknown; startDate?: unknown; endDate?: unknown }
  return {
    start: text(range.start ?? range.startDate),
    end: text(range.end ?? range.endDate),
  }
}

function participantTypesFromOverlay(overlay: Record<string, unknown>): string[] {
  const values = ['individual', 'organization', 'teacher', 'volunteer'] as const
  const aliases: Record<string, string> = {
    organization: 'school_institution',
    teacher: 'teacher_instructor',
  } as const
  return values
    .filter(key => overlay[`ujat.basicInfo.participant.${key}`] === true)
    .map(key => aliases[key] ?? key)
}

export function createUjatBasicInfoFormDefaults(
  sponsorId = ''
): DefaultValues<UjatBasicInfoFormValues> {
  return {
    title: undefined,
    mainTitle: undefined,
    titleEn: undefined,
    startDate: '',
    endDate: '',
    category: 'school',
    type: 'offline',
    businessArea: undefined,
    detailedProgramId: undefined,
    detailedProgramName: undefined,
    sponsorId,
    sponsorManagementIds: sponsorId ? [sponsorId] : [],
    sponsorManagerContactIds: [],
    sponsorManagerContactId: undefined,
    managerName: '',
    educationProcess: '',
    ipOwned: undefined,
    courseDeliveredBy: undefined,
    partnerInvolvement: undefined,
    ipsCategory: undefined,
    venueKind: 'inside',
    venueDetail: '',
    venue: '',
    generalParticipantTypes: ['school_institution', 'volunteer'],
    surveySurvey: UJAT_SURVEY_ITEMS_DEFAULT.survey,
    surveyVolunteerSatisfaction: UJAT_SURVEY_ITEMS_DEFAULT.volunteer_satisfaction,
    surveySchoolSatisfaction: UJAT_SURVEY_ITEMS_DEFAULT.school_satisfaction,
    surveyLectureEvaluation: UJAT_SURVEY_ITEMS_DEFAULT.lecture_evaluation,
    wagePaymentItemIds: [],
    ujatRegionCapacity: EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER,
  }
}

/**
 * Draft migration boundary only. The Wizard hydrates RHF once from an old local snapshot;
 * it does not restore that snapshot into the live Overlay Store.
 */
export function ujatBasicInfoFormValuesFromLegacyOverlay(
  overlay: Record<string, unknown>,
  defaults: DefaultValues<UjatBasicInfoFormValues> = createUjatBasicInfoFormDefaults()
): DefaultValues<UjatBasicInfoFormValues> {
  const range = operationRangeFromOverlay(overlay)
  const survey = readUjatSurveyItems(
    overlay['ujat.basicInfo.surveyItems'],
    UJAT_SURVEY_ITEMS_DEFAULT
  )
  const sponsorId = text(overlay['ujat.basicInfo.sponsorId'], String(defaults.sponsorId ?? ''))
  const contactIds = Array.isArray(overlay['ujat.basicInfo.sponsorContactIds'])
    ? overlay['ujat.basicInfo.sponsorContactIds'].map(String).filter(Boolean)
    : []
  const primaryContactId = text(
    overlay['ujat.basicInfo.sponsorContactId'],
    contactIds[0] ?? String(defaults.sponsorManagerContactId ?? '')
  )

  return {
    ...defaults,
    mainTitle: text(overlay['ujat.basicInfo.repKo'], String(defaults.mainTitle ?? '')),
    titleEn: text(overlay['ujat.basicInfo.repEn'], String(defaults.titleEn ?? '')),
    title: text(
      overlay['ujat.basicInfo.programManagementName'],
      String(defaults.title ?? '')
    ),
    detailedProgramId: text(
      overlay['ujat.basicInfo.detailedProgramId'],
      String(defaults.detailedProgramId ?? '')
    ),
    detailedProgramName: text(
      overlay['ujat.basicInfo.detailedProgramName'],
      String(defaults.detailedProgramName ?? '')
    ),
    startDate: range.start,
    endDate: range.end,
    businessArea: text(overlay['ujat.basicInfo.businessField'], String(defaults.businessArea ?? '')),
    sponsorId,
    sponsorManagementIds: sponsorId ? [sponsorId] : [],
    sponsorManagerContactIds: contactIds,
    sponsorManagerContactId: primaryContactId,
    managerName: text(overlay['ujat.basicInfo.sponsorManagerName']),
    educationProcess: text(overlay['ujat.basicInfo.educationCourse']),
    ipOwned: canonicalSelectValue(
      overlay['ujat.basicInfo.ipOwned'],
      defaults.ipOwned as 'JA' | 'Partner' | 'Jointly' | undefined
    ),
    courseDeliveredBy: canonicalSelectValue(
      overlay['ujat.basicInfo.courseDeliveredBy'],
      defaults.courseDeliveredBy as 'JA' | 'Partner' | 'Jointly' | undefined
    ) as UjatBasicInfoFormValues['courseDeliveredBy'],
    partnerInvolvement:
      overlay['ujat.basicInfo.partnerInvolvement'] === 'yes'
        ? true
        : overlay['ujat.basicInfo.partnerInvolvement'] === 'no'
          ? false
          : defaults.partnerInvolvement,
    ipsCategory: text(overlay['ujat.basicInfo.ipsCategory'], String(defaults.ipsCategory ?? '')),
    venueKind:
      overlay['ujat.basicInfo.educationVenueKind'] === 'outside' ||
      overlay['ujat.basicInfo.educationVenueKind'] === 'other' ||
      overlay['ujat.basicInfo.educationVenueKind'] === 'inside'
        ? overlay['ujat.basicInfo.educationVenueKind']
        : defaults.venueKind ?? 'inside',
    venueDetail: text(
      overlay['ujat.basicInfo.educationVenueDetail'],
      String(defaults.venueDetail ?? '')
    ),
    venue: text(
      overlay['ujat.basicInfo.educationVenueDetail'],
      String(defaults.venue ?? '')
    ),
    generalParticipantTypes: participantTypesFromOverlay(overlay),
    surveySurvey: survey.survey,
    surveyVolunteerSatisfaction: survey.volunteer_satisfaction,
    surveySchoolSatisfaction: survey.school_satisfaction,
    surveyLectureEvaluation: survey.lecture_evaluation,
    ...ujatKpiWageCapacityFromLegacyOverlay(overlay),
  }
}
