import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { ujatSurveyItemsFromProgramKeys } from '@/features/program/ujat/lib/registration-survey-items'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  buildUjatWageOverlayPatchFromPaymentItemIds,
  resolveUjatPaymentItemIdsFromProgram,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
} from '@/features/template/lib/template-form-select-options'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  isSponsorContactUnselected,
  isSponsorContactUnselectedLabel,
  resolveSponsorContactIdsForEdit,
  resolveSponsorContactIdsFromProgram,
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
  const topLevelDetailedName = program.generalCommonInfo?.detailedProgramName?.trim()
  const detailedProgramId =
    program.detailedProgramId?.trim() ||
    (topLevelDetailedName === '해당없음'
      ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
      : program.teamDivision?.trim() === UJAT_DETAILED_PROGRAM_UJAT_LABEL
        ? UJAT_DETAILED_PROGRAM_UJAT_VALUE
        : defaults.detailedProgramId)
  // id만 복원하고 name을 비워두면 편집 재개 시 세부 프로그램명이 어긋날 수 있다 — 항상 짝지어 복원한다.
  const detailedProgramName =
    topLevelDetailedName ||
    (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
      ? '해당없음'
      : detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE
        ? UJAT_DETAILED_PROGRAM_UJAT_LABEL
        : undefined)

  const operationRangeSeal =
    program.startDate && program.endDate
      ? { start: String(program.startDate), end: String(program.endDate) }
      : defaults.operationRangeSeal
  const sponsorManagerLine =
    program.generalCommonInfo?.sponsorManagerLine?.trim() || program.managerName?.trim() || ''
  const sponsorContactIds = resolveSponsorContactIdsFromProgram(program)

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
    'ujat.basicInfo.surveyItems': ujatSurveyItemsFromProgramKeys(program.generalSurveyMenuKeys),
    'ujat.kpi.participantCount': program.generalCommonInfo?.kpi?.finalParticipants ?? null,
    'ujat.kpi.instructor': null,
    'ujat.kpi.volunteer': program.generalCommonInfo?.kpi?.volunteerCount ?? null,
    'ujat.kpi.dispatchedSchool': program.generalCommonInfo?.kpi?.finalSchools ?? null,
    'ujat.kpi.dispatchedClass': program.generalCommonInfo?.kpi?.finalClasses ?? null,
    ...buildUjatWageOverlayPatchFromPaymentItemIds(resolveUjatPaymentItemIdsFromProgram(program)),
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
  const overlaySponsorId =
    typeof merged['ujat.basicInfo.sponsorId'] === 'string'
      ? merged['ujat.basicInfo.sponsorId'].trim()
      : ''
  const restoredContacts = resolveSponsorContactIdsForEdit({
    ids: Array.isArray(merged['ujat.basicInfo.sponsorContactIds'])
      ? (merged['ujat.basicInfo.sponsorContactIds'] as unknown[]).map(String)
      : [],
    id: typeof merged['ujat.basicInfo.sponsorContactId'] === 'string'
      ? merged['ujat.basicInfo.sponsorContactId']
      : '',
    managerLine: overlayManagerLine,
    hasSelectedSponsors: Boolean(
      overlaySponsorId && overlaySponsorId !== UJAT_SPONSOR_ALL_VALUE
    ),
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

/** 상세·모집 저장 시 draft에 세션 overlay를 실어 serviceDetailJson round-trip에 반영 */
export function buildUjatProgramDraftWithSessionOverlay(draft: Program): Program {
  return {
    ...draft,
    ujatRegistrationOverlay: touchUjatRegistrationOperationAnchorFromRangeSeal(
      readUjatRegistrationBasicInfoOverlayForSave()
    ),
  }
}

export type UjatApiOverlayReconcileInput = {
  mainTitle?: string | null
  titleEn?: string | null
  title?: string | null
  businessArea?: string | null
  sponsorId?: string | null
  educationProcess?: string | null
  ipOwned?: string | null
  courseDeliveredBy?: string | null
  ips?: Program['ips']
  partnerInvolvement?: boolean | null
  startDate?: string | null
  endDate?: string | null
  detailedProgramName?: string | null
  detailedProgramId?: string | number | null
  generalSurveyMenuKeys?: readonly string[]
  sponsorManagerContactIds?: readonly string[]
  sponsorManagerLine?: string | null
  kpi?: NonNullable<Program['generalCommonInfo']>['kpi']
}

/** GET 응답 top-level·envelope 값으로 stale registration.overlay 보정 */
export function reconcileUjatRegistrationOverlayFromApi(
  dto: UjatApiOverlayReconcileInput,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...overlay }

  if (dto.mainTitle?.trim()) {
    next['ujat.basicInfo.repKo'] = dto.mainTitle.trim()
  }
  if (dto.titleEn?.trim()) {
    next['ujat.basicInfo.repEn'] = dto.titleEn.trim()
  }
  if (dto.title?.trim()) {
    next['ujat.basicInfo.programManagementName'] = dto.title.trim()
  }
  if (dto.detailedProgramName?.trim() === '해당없음') {
    next['ujat.basicInfo.detailedProgramId'] = TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    next['ujat.basicInfo.detailedProgramName'] = '해당없음'
  }
  if (dto.businessArea?.trim()) {
    next['ujat.basicInfo.businessField'] = reverseBusinessField(dto.businessArea)
  }
  if (dto.sponsorId?.trim()) {
    next['ujat.basicInfo.sponsorId'] = dto.sponsorId.trim()
  }
  if (dto.educationProcess?.trim()) {
    next['ujat.basicInfo.educationCourse'] = dto.educationProcess.trim()
  }
  if (dto.ipOwned) {
    next['ujat.basicInfo.ipOwned'] = reverseIpOwned(dto.ipOwned)
  }
  if (dto.courseDeliveredBy) {
    next['ujat.basicInfo.courseDeliveredBy'] = reverseIpOwned(dto.courseDeliveredBy)
  }
  if (dto.ips) {
    next['ujat.basicInfo.ipsCategory'] = reverseIps(dto.ips)
  }
  if (dto.partnerInvolvement != null) {
    next['ujat.basicInfo.partnerInvolvement'] = reversePartnerInvolvement(dto.partnerInvolvement)
  }
  if (dto.startDate && dto.endDate) {
    next['ujat.basicInfo.operationRangeSeal'] = {
      start: String(dto.startDate),
      end: String(dto.endDate),
    }
  }
  if (dto.generalSurveyMenuKeys?.length) {
    next['ujat.basicInfo.surveyItems'] = ujatSurveyItemsFromProgramKeys(dto.generalSurveyMenuKeys)
  }
  const managerLine = dto.sponsorManagerLine?.trim()
  if (managerLine) {
    next['ujat.basicInfo.sponsorManagerName'] = managerLine
  }
  if (dto.sponsorManagerContactIds?.length) {
    const contactIds = resolveSponsorContactIdsForEdit({
      ids: [...dto.sponsorManagerContactIds],
      managerLine: managerLine ?? '',
    })
    next['ujat.basicInfo.sponsorContactIds'] = contactIds
    next['ujat.basicInfo.sponsorContactId'] = contactIds[0] ?? ''
  }
  if (dto.kpi) {
    next['ujat.kpi.participantCount'] = dto.kpi.finalParticipants
    next['ujat.kpi.instructor'] = dto.kpi.instructorCount
    next['ujat.kpi.volunteer'] = dto.kpi.volunteerCount
    next['ujat.kpi.dispatchedSchool'] = dto.kpi.finalSchools
    next['ujat.kpi.dispatchedClass'] = dto.kpi.finalClasses
  }

  return next
}

/** ProgramResponse + serviceDetail 파싱 결과로 overlay reconcile */
export function reconcileUjatRegistrationOverlayFromProgramResponse(
  dto: ProgramResponse,
  overlay: Record<string, unknown>,
  extras?: {
    generalSurveyMenuKeys?: readonly string[]
    sponsorManagerContactIds?: readonly string[]
    sponsorManagerLine?: string | null
    kpi?: NonNullable<Program['generalCommonInfo']>['kpi']
  }
): Record<string, unknown> {
  return reconcileUjatRegistrationOverlayFromApi(
    {
      mainTitle: dto.mainTitle,
      titleEn: dto.titleEn,
      title: dto.title,
      businessArea: dto.businessArea,
      sponsorId: dto.sponsorId,
      educationProcess: dto.educationProcess,
      ipOwned: dto.ipOwned,
      courseDeliveredBy: dto.courseDeliveredBy,
      ips: dto.ips as Program['ips'],
      partnerInvolvement: dto.partnerInvolvement,
      startDate: dto.startDate,
      endDate: dto.endDate,
      detailedProgramName: dto.detailedProgramName,
      detailedProgramId: dto.detailedProgramId,
      generalSurveyMenuKeys: extras?.generalSurveyMenuKeys,
      sponsorManagerContactIds: extras?.sponsorManagerContactIds,
      sponsorManagerLine: extras?.sponsorManagerLine,
      kpi: extras?.kpi,
    },
    overlay
  )
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
