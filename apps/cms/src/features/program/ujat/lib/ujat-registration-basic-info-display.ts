import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
  createUjatSurveyItemsDefault,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import {
  readUjatSurveyItems,
  resolveUjatSurveyItemsText,
  ujatGeneralSurveyMenuKeysFromOverlay,
  ujatSurveyItemsFromProgramKeys,
  UJAT_REGISTRATION_SURVEY_ITEM_LABELS,
  UJAT_SURVEY_MENU_KEY_BY_ITEM,
} from '@/features/program/ujat/lib/registration-survey-items'
import { ujatSponsorManagerContactIdsForApi } from '@/features/program/ujat/lib/ujat-sponsor-contact-api-payload'
import {
  readUjatWagePaymentItemValuesFromOverlay,
  resolveUjatWageDeductionLabel,
  ujatPaymentItemLabelsFromIds,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import { getUjatProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { readUjatRegistrationOverlayFromProgram } from '@/features/program/ujat/api/service-detail'
import {
  formatDateRange,
  normalizeProgramBusinessAreaValue,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { resolvePublicProgramTitle } from '@/features/program/shared/lib/public-program-title'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  generalParticipantTypesFromUjatFlags,
  resolveUjatParticipantTypeFlags,
  ujatParticipantTypeLabels,
} from '@/features/program/ujat/lib/participant-type-flags'

type OperationRangeSeal = { start?: string | null; end?: string | null } | null

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  return typeof v === 'string' ? v : undefined
}

function overlayNullableNumber(overlay: Record<string, unknown>, key: string): number | undefined {
  const v = overlay[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function readOperationRangeSeal(overlay: Record<string, unknown>): OperationRangeSeal {
  const v = overlay['ujat.basicInfo.operationRangeSeal']
  if (!v || typeof v !== 'object') return null
  return v as OperationRangeSeal
}

/** 상세 SSOT — 프로그램 overlay 4종, 없으면 저장된 키. 세션 overlay는 둘 다 없을 때만. */
export function resolveUjatSurveyItemFlags(program?: Program): Record<UjatSurveyRowId, boolean> {
  const programOverlay = program ? readUjatRegistrationOverlayFromProgram(program) : {}
  const fromProgram = programOverlay['ujat.basicInfo.surveyItems']
  if (fromProgram != null && typeof fromProgram === 'object') {
    return readUjatSurveyItems(fromProgram, createUjatSurveyItemsDefault(false))
  }
  if (program?.generalSurveyMenuKeys) {
    return ujatSurveyItemsFromProgramKeys(program.generalSurveyMenuKeys)
  }
  const sessionItems = getUjatProgramRegistrationOverlayRecord()['ujat.basicInfo.surveyItems']
  if (sessionItems != null && typeof sessionItems === 'object') {
    return readUjatSurveyItems(sessionItems, createUjatSurveyItemsDefault(false))
  }
  return createUjatSurveyItemsDefault(false)
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined | null
): string {
  if (value == null || value === '') return '-'
  return options.find(o => o.value === value)?.label ?? value
}

function resolveDetailedProgramName(detailedProgramId: string): string {
  if (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return '해당없음'
  if (detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE) return UJAT_DETAILED_PROGRAM_UJAT_LABEL
  return '-'
}

function resolveSponsorName(
  sponsorId: string,
  fallbackName?: string,
  sponsors: readonly SponsorManagementRow[] = []
): string {
  if (fallbackName?.trim()) return fallbackName.trim()
  if (!sponsorId || sponsorId === UJAT_SPONSOR_ALL_VALUE) return '-'
  return sponsors.find(s => s.id === sponsorId)?.name ?? '-'
}

function resolveOperationRange(
  seal: OperationRangeSeal,
  program: Program
): string {
  if (seal?.start && seal?.end) {
    return formatDateRange(seal.start, seal.end)
  }
  const range = formatDateRange(program.startDate, program.endDate)
  return range === '-' ? '-' : range
}

function resolveParticipantTypes(program: Program, overlay: Record<string, unknown>): string {
  return ujatParticipantTypeLabels(resolveUjatParticipantTypeFlags(program, overlay))
}

function resolveSurveyItemsText(surveyItems: Record<UjatSurveyRowId, boolean>): string {
  return resolveUjatSurveyItemsText(surveyItems)
}

export type UjatSurveyMenuItem = { key: string; label: string }

/** 공통 정보 > 설문 진행 항목 — 설문 관리 LNB 2depth */
export function resolveUjatSurveyMenuItems(program?: Program): UjatSurveyMenuItem[] {
  const surveyItems = resolveUjatSurveyItemFlags(program)
  const items: UjatSurveyMenuItem[] = []

  if (surveyItems.survey) {
    items.push({
      key: UJAT_SURVEY_MENU_KEY_BY_ITEM.survey,
      label: UJAT_REGISTRATION_SURVEY_ITEM_LABELS.survey,
    })
  }

  if (surveyItems.volunteer_satisfaction) {
    items.push({
      key: UJAT_SURVEY_MENU_KEY_BY_ITEM.volunteer_satisfaction,
      label: UJAT_REGISTRATION_SURVEY_ITEM_LABELS.volunteer_satisfaction,
    })
  }

  if (surveyItems.school_satisfaction) {
    items.push({
      key: UJAT_SURVEY_MENU_KEY_BY_ITEM.school_satisfaction,
      label: UJAT_REGISTRATION_SURVEY_ITEM_LABELS.school_satisfaction,
    })
  }

  if (surveyItems.lecture_evaluation) {
    items.push({
      key: UJAT_SURVEY_MENU_KEY_BY_ITEM.lecture_evaluation,
      label: UJAT_REGISTRATION_SURVEY_ITEM_LABELS.lecture_evaluation,
    })
  }

  return items
}

export type UjatRegistrationBasicInfoDisplay = {
  repKo: string
  repEn: string
  programManagementName: string
  publicProgramTitle: string
  detailedProgramName: string
  operationRange: string
  participantTypes: string
  businessField: string
  sponsorName: string
  sponsorManager: string
  surveyItems: string
  educationCourse: string
  ipOwned: string
  courseDeliveredBy: string
  partnerInvolvement: string
  ipsCategory: string
}

export function resolveUjatRegistrationBasicInfoOverlay(
  overlayInput?: Record<string, unknown>
): Record<string, unknown> {
  // 프로그램 상세 세션 overlay (PATCH 반영 전 편집 중). localStorage 템플릿 키는 사용하지 않음.
  const session = getUjatProgramRegistrationOverlayRecord()
  return { ...session, ...overlayInput }
}

/** 폼 양식 등록 양식 기본 정보 — overlay(저장본·기본값) 기준 표시 모델 */
export function resolveUjatRegistrationBasicInfoDisplay(
  program: Program,
  sponsorName?: string,
  overlayInput?: Record<string, unknown>,
  sponsors: readonly SponsorManagementRow[] = []
): UjatRegistrationBasicInfoDisplay {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults(sponsors)
  const overlay = resolveUjatRegistrationBasicInfoOverlay({
    ...readUjatRegistrationOverlayFromProgram(program),
    ...overlayInput,
  })

  const repKo = overlayString(overlay, 'ujat.basicInfo.repKo')?.trim() || defaults.repKo
  const repEn = overlayString(overlay, 'ujat.basicInfo.repEn')?.trim() || defaults.repEn
  const programManagementName =
    overlayString(overlay, 'ujat.basicInfo.programManagementName')?.trim() ||
    defaults.programManagementName
  const publicProgramTitle =
    resolvePublicProgramTitle({
      announcementTitle: program.generalCommonInfo?.announcementTitle,
      overlay,
      mainTitle:
        overlayString(overlay, 'ujat.basicInfo.repKo')?.trim() || program.mainTitle,
      title:
        overlayString(overlay, 'ujat.basicInfo.programManagementName')?.trim() ||
        program.title,
    }) || '-'
  const detailedProgramId =
    overlayString(overlay, 'ujat.basicInfo.detailedProgramId') ?? defaults.detailedProgramId
  const businessField =
    overlayString(overlay, 'ujat.basicInfo.businessField') ?? defaults.businessField
  const sponsorId = overlayString(overlay, 'ujat.basicInfo.sponsorId') ?? defaults.sponsorId
  const ipOwned = overlayString(overlay, 'ujat.basicInfo.ipOwned') ?? defaults.ipOwned
  const courseDeliveredBy =
    overlayString(overlay, 'ujat.basicInfo.courseDeliveredBy') ?? defaults.courseDeliveredBy
  const ipsCategory =
    overlayString(overlay, 'ujat.basicInfo.ipsCategory') ?? defaults.ipsCategory
  const educationCourseValue =
    overlayString(overlay, 'ujat.basicInfo.educationCourse')?.trim() ||
    program.educationProcess?.trim() ||
    ''
  const partnerInvolvementRaw = overlayString(overlay, 'ujat.basicInfo.partnerInvolvement')
  const partnerInvolvement =
    partnerInvolvementRaw === 'yes' || partnerInvolvementRaw === 'no'
      ? partnerInvolvementRaw
      : partnerInvolvementRaw === ''
        ? ''
        : defaults.partnerInvolvement

  const operationSeal = readOperationRangeSeal(overlay)
  const surveyItems = resolveUjatSurveyItemFlags(program)
  const sponsorManager =
    overlayString(overlay, 'ujat.basicInfo.sponsorManagerName')?.trim() ||
    program.generalCommonInfo?.sponsorManagerLine?.trim() ||
    '-'

  // 일정형(UJAT 기본·수정 잠금과 동일): stale overlay의 봉사단 세부명을 무시하고「해당없음」.
  // 커리큘럼형: BE top-level detailedProgramName / detailedProgramId를 overlay보다 우선.
  const isScheduleStructure = program.generalProgramEducationStructure === 'schedule'
  const topLevelDetailedName = program.generalCommonInfo?.detailedProgramName?.trim()
  const detailedProgramName = (() => {
    if (isScheduleStructure) return '해당없음'
    if (!program.detailedProgramId?.trim() && !topLevelDetailedName) return '-'
    if (topLevelDetailedName === '해당없음' || !program.detailedProgramId?.trim()) {
      if (topLevelDetailedName === '해당없음') return '해당없음'
    }
    if (topLevelDetailedName && program.detailedProgramId?.trim()) {
      return topLevelDetailedName
    }
    return resolveDetailedProgramName(detailedProgramId)
  })()

  return {
    repKo,
    repEn,
    programManagementName,
    publicProgramTitle,
    detailedProgramName,
    operationRange: resolveOperationRange(operationSeal, program),
    participantTypes: resolveParticipantTypes(program, overlay),
    businessField: optionLabel(TEMPLATE_FORM_BUSINESS_AREA_OPTIONS, businessField),
    sponsorName: resolveSponsorName(sponsorId, sponsorName, sponsors),
    sponsorManager,
    surveyItems: resolveSurveyItemsText(surveyItems),
    educationCourse: educationCourseValue
      ? optionLabel([...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS], educationCourseValue)
      : program.curriculum?.trim() || '-',
    ipOwned: optionLabel([...TEMPLATE_FORM_IP_OWNED_OPTIONS], ipOwned),
    courseDeliveredBy: optionLabel([...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS], courseDeliveredBy),
    partnerInvolvement: optionLabel(TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS, partnerInvolvement),
    ipsCategory: optionLabel(PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS, ipsCategory),
  }
}

/** 등록 양식 overlay → Program 필드 (상세·목록 mock 병합) */
export function applyUjatRegistrationOverlayToProgram(
  program: Program,
  overlayInput: Record<string, unknown>,
  options?: {
    /** 상세 수정 저장 — overlay에 KPI 키가 있으면 빈 값을 지움(0)으로 본다. 표시용 병합에서는 끈다. */
    kpiClearedAsZero?: boolean
  }
): Program {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const seal = readOperationRangeSeal(overlayInput)

  const repKo = overlayString(overlayInput, 'ujat.basicInfo.repKo')?.trim() || defaults.repKo
  const repEn = overlayString(overlayInput, 'ujat.basicInfo.repEn')?.trim() || defaults.repEn
  const title =
    overlayString(overlayInput, 'ujat.basicInfo.programManagementName')?.trim() ||
    defaults.programManagementName
  const businessArea = normalizeProgramBusinessAreaValue(
    overlayString(overlayInput, 'ujat.basicInfo.businessField') ?? defaults.businessField
  )
  const sponsorRaw = overlayString(overlayInput, 'ujat.basicInfo.sponsorId') ?? defaults.sponsorId
  const sponsorId = sponsorRaw && sponsorRaw !== UJAT_SPONSOR_ALL_VALUE ? sponsorRaw : program.sponsorId
  const ipOwned = overlayString(overlayInput, 'ujat.basicInfo.ipOwned') ?? defaults.ipOwned
  const courseDeliveredBy =
    overlayString(overlayInput, 'ujat.basicInfo.courseDeliveredBy') ?? defaults.courseDeliveredBy
  const educationCourse =
    overlayString(overlayInput, 'ujat.basicInfo.educationCourse') ?? defaults.educationCourse
  const ipsRaw = overlayString(overlayInput, 'ujat.basicInfo.ipsCategory') ?? defaults.ipsCategory
  const ips =
    ipsRaw === 'inspire' ? 'Inspire' : ipsRaw === 'succeed' ? 'Succeed' : ipsRaw === 'prepare' ? 'Prepare' : program.ips
  const partnerRaw = overlayString(overlayInput, 'ujat.basicInfo.partnerInvolvement')
  const partnerInvolvement =
    partnerRaw === 'yes' ? true : partnerRaw === 'no' ? false : program.partnerInvolvement

  let startDate = program.startDate
  let endDate = program.endDate
  if (seal?.start && seal?.end) {
    startDate = dayjs(seal.start).startOf('day').toISOString()
    endDate = dayjs(seal.end).endOf('day').toISOString()
  }

  const ipOwnedValue = ipOwned === 'ja' ? 'JA' : ipOwned === 'partner' ? 'Partner' : ipOwned === 'jointly' ? 'Jointly' : program.ipOwned
  const courseDeliveredByValue =
    courseDeliveredBy === 'ja'
      ? 'JA'
      : courseDeliveredBy === 'partner'
        ? 'Partner'
        : courseDeliveredBy === 'jointly'
          ? 'Jointly'
          : program.courseDeliveredBy

  const detailedProgramId =
    overlayString(overlayInput, 'ujat.basicInfo.detailedProgramId') ?? defaults.detailedProgramId
  // 버그 수정: id만 저장되고 name은 화면표시용으로만 파생되어 실제 Program 객체(요청 페이로드)에는
  // 세부 프로그램명이 전혀 실리지 않았다 — id·name을 항상 짝지어 Program에 반영한다
  // (다른 프로그램 유형과 동일한 detailedProgramId + generalCommonInfo.detailedProgramName 계약).
  const detailedProgramName =
    overlayString(overlayInput, 'ujat.basicInfo.detailedProgramName')?.trim() ||
    resolveDetailedProgramName(detailedProgramId)
  const teamDivision =
    detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE
      ? UJAT_DETAILED_PROGRAM_UJAT_LABEL
      : detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? undefined
        : program.teamDivision

  const paymentItemIds = readUjatWagePaymentItemValuesFromOverlay(overlayInput)
  const paymentItemsLabel = ujatPaymentItemLabelsFromIds(paymentItemIds)
  const deductionItemsLabel = resolveUjatWageDeductionLabel(paymentItemIds)
  const announcementTitle = program.generalCommonInfo?.announcementTitle?.trim()
  const sponsorManagerLine =
    overlayString(overlayInput, 'ujat.basicInfo.sponsorManagerName')?.trim() ||
    program.generalCommonInfo?.sponsorManagerLine
  const sponsorContactIds = ujatSponsorManagerContactIdsForApi({
    ids: Array.isArray(overlayInput['ujat.basicInfo.sponsorContactIds'])
      ? (overlayInput['ujat.basicInfo.sponsorContactIds'] as unknown[]).map(String)
      : undefined,
    id: overlayString(overlayInput, 'ujat.basicInfo.sponsorContactId') ?? undefined,
    managerLine: sponsorManagerLine ?? '',
  })
  const persistedSurveyMenuKeys = ujatGeneralSurveyMenuKeysFromOverlay(overlayInput)
  const generalSurveyMenuKeys =
    (persistedSurveyMenuKeys as Program['generalSurveyMenuKeys'] | undefined) ??
    program.generalSurveyMenuKeys
  const prevKpi = program.generalCommonInfo?.kpi
  const kpiNumber = (key: string, fallback: number | undefined): number => {
    const value = overlayNullableNumber(overlayInput, key)
    if (value != null) return value
    if (options?.kpiClearedAsZero && Object.prototype.hasOwnProperty.call(overlayInput, key)) {
      return 0
    }
    return fallback ?? 0
  }
  const participantFlags = resolveUjatParticipantTypeFlags(program, overlayInput)

  return {
    ...program,
    generalParticipantTypes: generalParticipantTypesFromUjatFlags(participantFlags),
    mainTitle: repKo,
    titleEn: repEn,
    title,
    teamDivision,
    // 무관 여부와 상관없이 id·name을 둘 다 Program에 반영 — 일반/TT/1사1교와 동일한 계약.
    detailedProgramId,
    businessArea,
    sponsorId,
    ipOwned: ipOwnedValue,
    courseDeliveredBy: courseDeliveredByValue,
    educationProcess: educationCourse || program.educationProcess,
    ips,
    partnerInvolvement,
    startDate,
    endDate,
    generalSurveyMenuKeys,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      detailedProgramName,
      paymentItems: paymentItemsLabel,
      deductionItems: deductionItemsLabel,
      ...(announcementTitle ? { announcementTitle } : {}),
      sponsorManagerLine,
      sponsorManagerContactIds:
        sponsorContactIds.length > 0 ? sponsorContactIds : undefined,
      sponsorManagerContactId: sponsorContactIds[0],
      kpi: {
        finalParticipants: kpiNumber('ujat.kpi.participantCount', prevKpi?.finalParticipants),
        instructorCount: kpiNumber('ujat.kpi.instructor', prevKpi?.instructorCount),
        volunteerCount: kpiNumber('ujat.kpi.volunteer', prevKpi?.volunteerCount),
        finalSchools: kpiNumber('ujat.kpi.dispatchedSchool', prevKpi?.finalSchools),
        finalClasses: kpiNumber('ujat.kpi.dispatchedClass', prevKpi?.finalClasses),
      },
    },
  }
}

/** 모집 공고용 프로그램명 — 모집 탭·저장된 announcementTitle (등록 폼에는 공고용 필드 없음) */
export function resolveUjatAnnouncementTitle(program: Program): string {
  return (
    resolvePublicProgramTitle({
      announcementTitle: program.generalCommonInfo?.announcementTitle,
      overlay: resolveUjatRegistrationBasicInfoOverlay(
        readUjatRegistrationOverlayFromProgram(program)
      ),
      mainTitle: program.mainTitle,
      title: program.title,
    }) || '-'
  )
}

export function applyUjatRegistrationTemplateDefaults(program: Program): Program {
  const overlay = resolveUjatRegistrationBasicInfoOverlay(
    readUjatRegistrationOverlayFromProgram(program)
  )
  if (Object.keys(overlay).length === 0) return program
  return applyUjatRegistrationOverlayToProgram(program, overlay)
}
