import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
  createUjatSurveyItemsDefault,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { buildUjatHalfEducationScheduleOverlayDefaults } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import { buildUjatEducationScheduleSettingsOverlayDefaults } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { buildUjatRegionCapacityOverlayDefaults } from '@/features/program/ujat/lib/ujat-region-capacity-display'
import {
  buildUjatWageOverlayPatchFromPaymentItemIds,
  resolveUjatPaymentItemIdsFromProgram,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { TEMPLATE_FORM_BUSINESS_AREA_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  isSponsorContactUnselected,
  isSponsorContactUnselectedLabel,
  resolveSponsorContactIdsForEdit,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'

function reverseBusinessField(value: string | undefined): string {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const trimmed = value?.trim()
  if (!trimmed) return defaults.businessField
  const alreadyFormKey = TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.some(option => option.value === trimmed)
  if (alreadyFormKey) return trimmed
  const normalized = normalizeProgramBusinessAreaValue(trimmed)
  return (
    TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(
      option => normalizeProgramBusinessAreaValue(option.label) === normalized
    )?.value ?? defaults.businessField
  )
}

function reverseIpOwned(value: string | undefined): string {
  if (value === 'JA') return 'ja'
  if (value === 'Partner') return 'partner'
  if (value === 'Jointly') return 'jointly'
  return 'ja'
}

function reverseIps(value: Program['ips']): string {
  if (value === 'Inspire') return 'inspire'
  if (value === 'Succeed') return 'succeed'
  return 'prepare'
}

function reversePartnerInvolvement(value: boolean | undefined): 'yes' | 'no' {
  return value ? 'yes' : 'no'
}

/** 프로그램 mock → 등록 양식 overlay 키 (수정 모드 진입 시 시드) */
export function buildUjatRegistrationBasicInfoOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const detailedProgramId =
    program.detailedProgramId?.trim() ||
    (program.teamDivision?.trim() === UJAT_DETAILED_PROGRAM_UJAT_LABEL
      ? UJAT_DETAILED_PROGRAM_UJAT_VALUE
      : defaults.detailedProgramId)
  // id만 복원하고 name을 비워두면 편집 재개 시 세부 프로그램명이 어긋날 수 있다 — 항상 짝지어 복원한다.
  const detailedProgramName =
    program.generalCommonInfo?.detailedProgramName?.trim() ||
    (detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE
      ? UJAT_DETAILED_PROGRAM_UJAT_LABEL
      : undefined)

  const operationRangeSeal =
    program.startDate && program.endDate
      ? { start: String(program.startDate), end: String(program.endDate) }
      : defaults.operationRangeSeal
  const sponsorManagerLine =
    program.generalCommonInfo?.sponsorManagerLine?.trim() || program.managerName?.trim() || ''
  const sponsorContactIds = resolveSponsorContactIdsForEdit({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
    managerLine: sponsorManagerLine,
  })

  return {
    'ujat.basicInfo.repKo': program.mainTitle?.trim() || defaults.repKo,
    'ujat.basicInfo.repEn': program.titleEn?.trim() || defaults.repEn,
    'ujat.basicInfo.programManagementName': program.title?.trim() || defaults.programManagementName,
    'ujat.basicInfo.detailedProgramId': detailedProgramId,
    'ujat.basicInfo.detailedProgramName': detailedProgramName,
    'ujat.basicInfo.operationRangeSeal': operationRangeSeal,
    'ujat.basicInfo.businessField': reverseBusinessField(program.businessArea),
    'ujat.basicInfo.sponsorId': program.sponsorId ?? defaults.sponsorId,
    'ujat.basicInfo.sponsorContactIds': sponsorContactIds,
    'ujat.basicInfo.sponsorContactId': sponsorContactIds[0] ?? defaults.sponsorContactId,
    'ujat.basicInfo.sponsorManagerName': sponsorManagerLine,
    'ujat.basicInfo.ipOwned': reverseIpOwned(program.ipOwned),
    'ujat.basicInfo.courseDeliveredBy': reverseIpOwned(program.courseDeliveredBy),
    'ujat.basicInfo.ipsCategory': reverseIps(program.ips),
    'ujat.basicInfo.educationCourse': program.educationProcess ?? defaults.educationCourse,
    'ujat.basicInfo.partnerInvolvement': reversePartnerInvolvement(program.partnerInvolvement),
    'ujat.basicInfo.participant.individual': defaults.participantIndividual,
    'ujat.basicInfo.participant.organization': defaults.participantOrganization,
    'ujat.basicInfo.participant.teacher': defaults.participantTeacher,
    'ujat.basicInfo.participant.volunteer': defaults.participantVolunteer,
    'ujat.basicInfo.surveyItems': createUjatSurveyItemsDefault(),
    'ujat.kpi.participantCount': program.generalCommonInfo?.kpi?.finalParticipants ?? null,
    'ujat.kpi.instructor': null,
    'ujat.kpi.volunteer': program.generalCommonInfo?.kpi?.volunteerCount ?? null,
    'ujat.kpi.dispatchedSchool': program.generalCommonInfo?.kpi?.finalSchools ?? null,
    'ujat.kpi.dispatchedClass': program.generalCommonInfo?.kpi?.finalClasses ?? null,
    ...buildUjatWageOverlayPatchFromPaymentItemIds(resolveUjatPaymentItemIdsFromProgram(program)),
    ...buildUjatHalfEducationScheduleOverlayDefaults('h1'),
    ...buildUjatHalfEducationScheduleOverlayDefaults('h2'),
    ...buildUjatEducationScheduleSettingsOverlayDefaults('h1'),
    ...buildUjatEducationScheduleSettingsOverlayDefaults('h2'),
    ...buildUjatRegionCapacityOverlayDefaults(),
  }
}

export function seedUjatRegistrationBasicInfoOverlayFromProgram(program: Program): void {
  const saved = resolveUjatRegistrationBasicInfoOverlay(program.ujatRegistrationOverlay)
  const fromProgram = buildUjatRegistrationBasicInfoOverlayFromProgram(program)
  // API overlay·세션 값이 1차 컬럼 기본값(일정·정원 목업)을 덮어쓴다.
  const merged = { ...fromProgram, ...saved }
  const overlayManagerLine =
    (typeof merged['ujat.basicInfo.sponsorManagerName'] === 'string'
      ? merged['ujat.basicInfo.sponsorManagerName'].trim()
      : '') ||
    program.generalCommonInfo?.sponsorManagerLine?.trim() ||
    program.managerName?.trim() ||
    ''
  const restoredContacts = resolveSponsorContactIdsForEdit({
    ids: Array.isArray(merged['ujat.basicInfo.sponsorContactIds'])
      ? (merged['ujat.basicInfo.sponsorContactIds'] as unknown[]).map(String)
      : [],
    id: typeof merged['ujat.basicInfo.sponsorContactId'] === 'string'
      ? merged['ujat.basicInfo.sponsorContactId']
      : '',
    managerLine: overlayManagerLine,
  })
  if (
    restoredContacts.some(id => isSponsorContactUnselected(id)) ||
    isSponsorContactUnselectedLabel(overlayManagerLine)
  ) {
    merged['ujat.basicInfo.sponsorContactIds'] = [SPONSOR_CONTACT_UNSELECTED_VALUE]
    merged['ujat.basicInfo.sponsorContactId'] = SPONSOR_CONTACT_UNSELECTED_VALUE
    merged['ujat.basicInfo.sponsorManagerName'] = SPONSOR_CONTACT_UNSELECTED_LABEL
  }
  patchUjatProgramRegistrationOverlay(merged)
}

export function readUjatRegistrationBasicInfoOverlayForSave(): Record<string, unknown> {
  return { ...getUjatProgramRegistrationOverlayRecord() }
}

/** 수정 저장 시 overlay 앵커 날짜 동기화 */
export function touchUjatRegistrationOperationAnchorFromRangeSeal(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const seal = overlay['ujat.basicInfo.operationRangeSeal'] as
    | { start?: string | null; end?: string | null }
    | null
    | undefined
  if (!seal?.start) return overlay
  return {
    ...overlay,
    'ujat.basicInfo.operationAnchorIso': dayjs(seal.start).toISOString(),
  }
}
