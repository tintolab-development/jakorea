import dayjs from 'dayjs'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
  createUjatSurveyItemsDefault,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
} from '@/features/template/lib/program-registration-survey-items'
import {
  readUjatWagePaymentItemValuesFromOverlay,
  resolveUjatWageDeductionLabel,
  ujatPaymentItemLabelsFromIds,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import { loadUjatRegistrationTemplateSave } from '@/features/program/ujat/lib/ujat-registration-template-local-save'
import { formatDateRange } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
  TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'

type OperationRangeSeal = { start?: string | null; end?: string | null } | null

const SURVEY_LABELS: Record<UjatSurveyRowId, string> = PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  return typeof v === 'string' ? v : undefined
}

function overlayBoolean(overlay: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = overlay[key]
  return typeof v === 'boolean' ? v : fallback
}

function readOperationRangeSeal(overlay: Record<string, unknown>): OperationRangeSeal {
  const v = overlay['ujat.basicInfo.operationRangeSeal']
  if (!v || typeof v !== 'object') return null
  return v as OperationRangeSeal
}

function readSurveyItems(overlay: Record<string, unknown>): Record<UjatSurveyRowId, boolean> {
  const raw = overlay['ujat.basicInfo.surveyItems']
  if (!raw || typeof raw !== 'object') return createUjatSurveyItemsDefault()
  const o = raw as Record<string, unknown>
  const defaults = createUjatSurveyItemsDefault()
  const legacySatisfaction =
    o.satisfaction === true ||
    o.volunteer_satisfaction === true ||
    o.school_satisfaction === true ||
    o.student_satisfaction === true ||
    o.teacher_satisfaction === true

  return {
    survey: typeof o.survey === 'boolean' ? o.survey : defaults.survey,
    satisfaction:
      typeof o.satisfaction === 'boolean'
        ? o.satisfaction
        : legacySatisfaction
          ? true
          : defaults.satisfaction,
    lecture_evaluation:
      typeof o.lecture_evaluation === 'boolean' ? o.lecture_evaluation : defaults.lecture_evaluation,
  }
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined | null
): string {
  if (value == null || value === '') return '-'
  return options.find(o => o.value === value)?.label ?? value
}

function resolveDetailedProgramName(detailedProgramId: string): string {
  if (detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE) return UJAT_DETAILED_PROGRAM_UJAT_LABEL
  const row = mockDetailedProgramManagementListRows.find(r => r.id === detailedProgramId)
  return row?.name ?? '-'
}

function resolveSponsorName(sponsorId: string, fallbackName?: string): string {
  if (fallbackName?.trim()) return fallbackName.trim()
  if (!sponsorId || sponsorId === UJAT_SPONSOR_ALL_VALUE) return '-'
  return mockSponsorManagementListRows.find(s => s.id === sponsorId)?.name ?? '-'
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

function resolveParticipantTypes(overlay: Record<string, unknown>, defaults: ReturnType<typeof createUjatRegistrationBasicInfoOverlayDefaults>): string {
  const flags = {
    individual: overlayBoolean(overlay, 'ujat.basicInfo.participant.individual', defaults.participantIndividual),
    organization: overlayBoolean(
      overlay,
      'ujat.basicInfo.participant.organization',
      defaults.participantOrganization
    ),
    teacher: overlayBoolean(overlay, 'ujat.basicInfo.participant.teacher', defaults.participantTeacher),
    volunteer: overlayBoolean(overlay, 'ujat.basicInfo.participant.volunteer', defaults.participantVolunteer),
  }
  const labels = TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.filter(opt => {
    switch (opt.value) {
      case 'individual':
        return flags.individual
      case 'school_institution':
        return flags.organization
      case 'teacher_instructor':
        return flags.teacher
      case 'volunteer':
        return flags.volunteer
      default:
        return false
    }
  }).map(opt => opt.label)
  return labels.length > 0 ? labels.join(', ') : '-'
}

function resolveSurveyItemsText(surveyItems: Record<UjatSurveyRowId, boolean>): string {
  const labels = (Object.keys(SURVEY_LABELS) as UjatSurveyRowId[])
    .filter(id => surveyItems[id])
    .map(id => SURVEY_LABELS[id])
  return labels.length > 0 ? labels.join(', ') : '-'
}

export type UjatSurveyMenuItem = { key: string; label: string }

/** 공통 정보 > 설문 진행 항목 — 설문 관리 LNB 2depth */
export function resolveUjatSurveyMenuItems(program?: Program): UjatSurveyMenuItem[] {
  const overlay = resolveUjatRegistrationBasicInfoOverlay()
  void program
  const surveyItems = readSurveyItems(overlay)
  const items: UjatSurveyMenuItem[] = []

  if (surveyItems.survey) {
    items.push({ key: 'survey-poll', label: SURVEY_LABELS.survey })
  }

  if (surveyItems.satisfaction) {
    items.push({ key: 'survey-satisfaction', label: SURVEY_LABELS.satisfaction })
  }

  if (surveyItems.lecture_evaluation) {
    items.push({ key: 'survey-lecture-eval', label: SURVEY_LABELS.lecture_evaluation })
  }

  return items
}

export type UjatRegistrationBasicInfoDisplay = {
  repKo: string
  repEn: string
  programManagementName: string
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
  const saved = loadUjatRegistrationTemplateSave()
  return { ...overlayInput, ...(saved?.overlay ?? {}) }
}

/** 폼 양식 등록 양식 기본 정보 — overlay(저장본·기본값) 기준 표시 모델 */
export function resolveUjatRegistrationBasicInfoDisplay(
  program: Program,
  sponsorName?: string,
  overlayInput?: Record<string, unknown>
): UjatRegistrationBasicInfoDisplay {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const overlay = resolveUjatRegistrationBasicInfoOverlay(overlayInput)

  const repKo = overlayString(overlay, 'ujat.basicInfo.repKo')?.trim() || defaults.repKo
  const repEn = overlayString(overlay, 'ujat.basicInfo.repEn')?.trim() || defaults.repEn
  const programManagementName =
    overlayString(overlay, 'ujat.basicInfo.programManagementName')?.trim() ||
    defaults.programManagementName
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
  const educationCourse =
    overlayString(overlay, 'ujat.basicInfo.educationCourse') ?? defaults.educationCourse
  const partnerInvolvementRaw = overlayString(overlay, 'ujat.basicInfo.partnerInvolvement')
  const partnerInvolvement =
    partnerInvolvementRaw === 'yes' || partnerInvolvementRaw === 'no'
      ? partnerInvolvementRaw
      : defaults.partnerInvolvement

  const operationSeal = readOperationRangeSeal(overlay)
  const surveyItems = readSurveyItems(overlay)

  return {
    repKo,
    repEn,
    programManagementName,
    detailedProgramName: resolveDetailedProgramName(detailedProgramId),
    operationRange: resolveOperationRange(operationSeal, program),
    participantTypes: resolveParticipantTypes(overlay, defaults),
    businessField: optionLabel(TEMPLATE_FORM_BUSINESS_AREA_OPTIONS, businessField),
    sponsorName: resolveSponsorName(sponsorId, sponsorName),
    sponsorManager: '-',
    surveyItems: resolveSurveyItemsText(surveyItems),
    educationCourse: optionLabel([...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS], educationCourse),
    ipOwned: optionLabel([...TEMPLATE_FORM_IP_OWNED_OPTIONS], ipOwned),
    courseDeliveredBy: optionLabel([...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS], courseDeliveredBy),
    partnerInvolvement: optionLabel(TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS, partnerInvolvement),
    ipsCategory: optionLabel(PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS, ipsCategory),
  }
}

/** 등록 양식 overlay → Program 필드 (상세·목록 mock 병합) */
export function applyUjatRegistrationOverlayToProgram(
  program: Program,
  overlayInput: Record<string, unknown>
): Program {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const seal = readOperationRangeSeal(overlayInput)

  const repKo = overlayString(overlayInput, 'ujat.basicInfo.repKo')?.trim() || defaults.repKo
  const repEn = overlayString(overlayInput, 'ujat.basicInfo.repEn')?.trim() || defaults.repEn
  const title =
    overlayString(overlayInput, 'ujat.basicInfo.programManagementName')?.trim() ||
    defaults.programManagementName
  const businessArea =
    overlayString(overlayInput, 'ujat.basicInfo.businessField') ?? defaults.businessField
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
  const teamDivision =
    detailedProgramId === UJAT_DETAILED_PROGRAM_UJAT_VALUE
      ? UJAT_DETAILED_PROGRAM_UJAT_LABEL
      : program.teamDivision

  const paymentItemIds = readUjatWagePaymentItemValuesFromOverlay(overlayInput)
  const paymentItemsLabel = ujatPaymentItemLabelsFromIds(paymentItemIds)
  const deductionItemsLabel = resolveUjatWageDeductionLabel(paymentItemIds)

  return {
    ...program,
    mainTitle: repKo,
    titleEn: repEn,
    title,
    teamDivision,
    businessArea,
    sponsorId,
    ipOwned: ipOwnedValue,
    courseDeliveredBy: courseDeliveredByValue,
    educationProcess: educationCourse || program.educationProcess,
    ips,
    partnerInvolvement,
    startDate,
    endDate,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      paymentItems: paymentItemsLabel,
      deductionItems: deductionItemsLabel,
    },
  }
}

export function applyUjatRegistrationTemplateDefaults(program: Program): Program {
  return applyUjatRegistrationOverlayToProgram(program, resolveUjatRegistrationBasicInfoOverlay())
}
