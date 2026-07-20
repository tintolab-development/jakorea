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
    program.teamDivision?.trim() === UJAT_DETAILED_PROGRAM_UJAT_LABEL
      ? UJAT_DETAILED_PROGRAM_UJAT_VALUE
      : defaults.detailedProgramId

  const operationRangeSeal =
    program.startDate && program.endDate
      ? { start: String(program.startDate), end: String(program.endDate) }
      : defaults.operationRangeSeal

  return {
    'ujat.basicInfo.repKo': program.mainTitle?.trim() || defaults.repKo,
    'ujat.basicInfo.repEn': program.titleEn?.trim() || defaults.repEn,
    'ujat.basicInfo.programManagementName': program.title?.trim() || defaults.programManagementName,
    'ujat.basicInfo.detailedProgramId': detailedProgramId,
    'ujat.basicInfo.operationRangeSeal': operationRangeSeal,
    'ujat.basicInfo.businessField': program.businessArea ?? defaults.businessField,
    'ujat.basicInfo.sponsorId': program.sponsorId ?? defaults.sponsorId,
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
    ...buildUjatWageOverlayPatchFromPaymentItemIds(resolveUjatPaymentItemIdsFromProgram(program)),
    ...buildUjatHalfEducationScheduleOverlayDefaults('h1'),
    ...buildUjatHalfEducationScheduleOverlayDefaults('h2'),
    ...buildUjatEducationScheduleSettingsOverlayDefaults('h1'),
    ...buildUjatEducationScheduleSettingsOverlayDefaults('h2'),
    ...buildUjatRegionCapacityOverlayDefaults(),
  }
}

export function seedUjatRegistrationBasicInfoOverlayFromProgram(program: Program): void {
  const saved = resolveUjatRegistrationBasicInfoOverlay()
  const fromProgram = buildUjatRegistrationBasicInfoOverlayFromProgram(program)
  patchUjatProgramRegistrationOverlay({ ...saved, ...fromProgram })
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
