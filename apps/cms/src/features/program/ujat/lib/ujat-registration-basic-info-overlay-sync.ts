import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  createUjatSurveyItemsDefault,
  hasExplicitUjatSurveySplit,
  readUjatSurveyItems,
  ujatSurveyItemsFromProgramKeys,
} from '@/features/program/ujat/lib/registration-survey-items'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  applyUjatRegistrationOverlayToProgram,
  resolveUjatRegistrationBasicInfoOverlay,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
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
import { collectUjatRegistrationCreateOverlay } from '@/features/program/ujat/lib/ujat-registration-local-save'
import { resolveUjatParticipantTypeFlags } from '@/features/program/ujat/lib/participant-type-flags'
import { buildUjatRecruitInstitutionOverlayFromProgram } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
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
  if (!value) return ''
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

function reversePartnerInvolvement(value: boolean | null | undefined): 'yes' | 'no' | '' {
  return value == null ? '' : value ? 'yes' : 'no'
}

function participantFlagsFromUjatProgram(program: Program): {
  individual: boolean
  organization: boolean
  teacher: boolean
  volunteer: boolean
} {
  return resolveUjatParticipantTypeFlags(program)
}

/** 프로그램 mock → 등록 양식 overlay 키 (수정 모드 진입 시 시드) */
export function buildUjatRegistrationBasicInfoOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const topLevelDetailedName = program.generalCommonInfo?.detailedProgramName?.trim()
  const detailedProgramId = program.detailedProgramId?.trim() || ''
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
  const participantFlags = participantFlagsFromUjatProgram(program)

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
    'ujat.basicInfo.educationCourse': program.educationProcess ?? '',
    'ujat.basicInfo.partnerInvolvement': reversePartnerInvolvement(program.partnerInvolvement),
    'ujat.basicInfo.participant.individual': participantFlags.individual,
    'ujat.basicInfo.participant.organization': participantFlags.organization,
    'ujat.basicInfo.participant.teacher': participantFlags.teacher,
    'ujat.basicInfo.participant.volunteer': participantFlags.volunteer,
    'ujat.basicInfo.surveyItems': ujatSurveyItemsFromProgramKeys(program.generalSurveyMenuKeys),
    'ujat.kpi.participantCount': program.generalCommonInfo?.kpi?.finalParticipants ?? null,
    'ujat.kpi.instructor': program.generalCommonInfo?.kpi?.instructorCount ?? null,
    'ujat.kpi.volunteer': program.generalCommonInfo?.kpi?.volunteerCount ?? null,
    'ujat.kpi.dispatchedSchool': program.generalCommonInfo?.kpi?.finalSchools ?? null,
    'ujat.kpi.dispatchedClass': program.generalCommonInfo?.kpi?.finalClasses ?? null,
    ...buildUjatWageOverlayPatchFromPaymentItemIds(resolveUjatPaymentItemIdsFromProgram(program)),
  }
}

export function seedUjatRegistrationBasicInfoOverlayFromProgram(program: Program): void {
  const saved = resolveUjatRegistrationBasicInfoOverlay(program.ujatRegistrationOverlay)
  const fromProgram = buildUjatRegistrationBasicInfoOverlayFromProgram(program)
  const merged = { ...saved, ...fromProgram }
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
  const explicitSurveyItems = program.ujatRegistrationOverlay?.['ujat.basicInfo.surveyItems']
  if (hasExplicitUjatSurveySplit(explicitSurveyItems)) {
    merged['ujat.basicInfo.surveyItems'] = readUjatSurveyItems(
      explicitSurveyItems,
      createUjatSurveyItemsDefault(false)
    )
  }
  patchUjatProgramRegistrationOverlay(merged)
}

export function readUjatRegistrationBasicInfoOverlayForSave(): Record<string, unknown> {
  return { ...getUjatProgramRegistrationOverlayRecord() }
}

/** apply 후 canonical에서 basicInfo / kpi / wage overlay를 재생성 */
function preferExplicitUjatSurveyItems(
  merged: Record<string, unknown>,
  ...candidates: unknown[]
): Record<string, unknown> {
  for (const candidate of candidates) {
    if (!hasExplicitUjatSurveySplit(candidate)) continue
    return {
      ...merged,
      'ujat.basicInfo.surveyItems': readUjatSurveyItems(
        candidate,
        createUjatSurveyItemsDefault(false)
      ),
    }
  }
  return merged
}

export function resyncUjatRegistrationOverlayFromProgram(
  program: Program,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const merged = {
    ...buildUjatRegistrationBasicInfoOverlayFromProgram(program),
    ...(extra ?? {}),
  }
  return preferExplicitUjatSurveyItems(
    merged,
    extra?.['ujat.basicInfo.surveyItems'],
    program.ujatRegistrationOverlay?.['ujat.basicInfo.surveyItems']
  )
}

/** 모집 저장 — 세션 모집 키를 합친 뒤 기관 모집은 중첩에서 다시 그린다 */
export function resyncUjatPersistOverlayFromProgram(
  program: Program,
  extra?: Record<string, unknown>,
  options?: { includeRecruit?: boolean }
): Record<string, unknown> {
  const registration = resyncUjatRegistrationOverlayFromProgram(program, extra)
  const next = options?.includeRecruit
    ? { ...registration, ...buildUjatRecruitInstitutionOverlayFromProgram(program) }
    : registration
  return touchUjatRegistrationOperationAnchorFromRangeSeal(next)
}

function pickUjatRecruitSessionKeys(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (
      key.startsWith('ujat.recruit.') ||
      key.startsWith('recruit.') ||
      key.startsWith('recruitVolunteer') ||
      key.startsWith('ujatRecruit')
    ) {
      out[key] = value
    }
  }
  return out
}

/** 상세·모집 저장 시 draft에 세션 overlay를 실어 serviceDetailJson round-trip에 반영 */
export function buildUjatProgramDraftWithSessionOverlay(
  draft: Program,
  options?: { includeRecruitSession?: boolean }
): Program {
  const sessionFromStore = readUjatRegistrationBasicInfoOverlayForSave()
  const session = options?.includeRecruitSession
    ? collectUjatRegistrationCreateOverlay({
        ...sessionFromStore,
        ...(draft.ujatRegistrationOverlay ?? {}),
        ...pickUjatRecruitSessionKeys(sessionFromStore),
      })
    : {
        ...(draft.ujatRegistrationOverlay ?? {}),
        ...sessionFromStore,
      }
  const overlay = resyncUjatPersistOverlayFromProgram(draft, session, {
    includeRecruit: options?.includeRecruitSession === true,
  })
  const applied = applyUjatRegistrationOverlayToProgram(draft, overlay, {
    kpiClearedAsZero: true,
  })
  return {
    ...applied,
    ujatRegistrationOverlay: overlay,
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
  kpi?: Partial<NonNullable<Program['generalCommonInfo']>['kpi']>
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
  if (dto.businessArea?.trim()) {
    next['ujat.basicInfo.businessField'] = reverseBusinessField(dto.businessArea)
  }
  if (dto.sponsorId?.trim()) {
    next['ujat.basicInfo.sponsorId'] = dto.sponsorId.trim()
  }
  next['ujat.basicInfo.educationCourse'] = dto.educationProcess?.trim() ?? ''
  next['ujat.basicInfo.ipOwned'] = reverseIpOwned(dto.ipOwned ?? undefined)
  if (dto.courseDeliveredBy) {
    next['ujat.basicInfo.courseDeliveredBy'] = reverseIpOwned(dto.courseDeliveredBy)
  }
  if (dto.ips) {
    next['ujat.basicInfo.ipsCategory'] = reverseIps(dto.ips)
  }
  next['ujat.basicInfo.partnerInvolvement'] = reversePartnerInvolvement(dto.partnerInvolvement)
  if (dto.detailedProgramName?.trim() === '해당없음') {
    next['ujat.basicInfo.detailedProgramId'] = TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    next['ujat.basicInfo.detailedProgramName'] = '해당없음'
  } else {
    next['ujat.basicInfo.detailedProgramId'] =
      dto.detailedProgramId == null ? '' : String(dto.detailedProgramId)
    next['ujat.basicInfo.detailedProgramName'] = dto.detailedProgramName?.trim() ?? ''
  }
  if (dto.startDate && dto.endDate) {
    next['ujat.basicInfo.operationRangeSeal'] = {
      start: String(dto.startDate),
      end: String(dto.endDate),
    }
  }
  if (dto.generalSurveyMenuKeys && !hasExplicitUjatSurveySplit(next['ujat.basicInfo.surveyItems'])) {
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
    const assignKpi = (key: string, value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) next[key] = value
    }
    assignKpi('ujat.kpi.participantCount', dto.kpi.finalParticipants)
    assignKpi('ujat.kpi.instructor', dto.kpi.instructorCount)
    assignKpi('ujat.kpi.volunteer', dto.kpi.volunteerCount)
    assignKpi('ujat.kpi.dispatchedSchool', dto.kpi.finalSchools)
    assignKpi('ujat.kpi.dispatchedClass', dto.kpi.finalClasses)
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
    kpi?: Partial<NonNullable<Program['generalCommonInfo']>['kpi']>
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
