/**
 * TT 상세·수정 시드 — GET Program 필드만으로 프로그램 유형 설정 표시값을 보강한다.
 * registrationOverlay 는 사용하지 않는다.
 */
import type { Program } from '@/types/domain'
import {
  buildIpsTypeSummaryFull,
  educationFormLabelFromValue,
} from '@/features/program/general/lib/overlay-phase1/common-info-domain'
import {
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
  type ProgramRegistrationIpsCategory,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  resolveStoredEducationFormLabel,
  resolveStoredIpsTypeSummary,
} from '@/features/program/shared/model/program-detail-edit-schema'

export type TrainedTeacherEducationFormApiValue =
  | 'online'
  | 'offline'
  | 'hybrid'
  | 'participant_selection'

const EDUCATION_FORM_API_VALUES = new Set<string>([
  'online',
  'offline',
  'hybrid',
  EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
])

/**
 * API `Program.type`(OpenAPI string) → 등록·수정 폼 educationForm 값.
 * - 온라인/오프라인/온·오프라인: `online` | `offline` | `hybrid`
 * - 참여자 선택: `participant_selection` (BE 최상위 type 문자열; domain ProgramType 에는 없음)
 */
export function normalizeTrainedTeacherEducationFormFromApiType(
  raw: string | undefined
): TrainedTeacherEducationFormApiValue | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  if (EDUCATION_FORM_API_VALUES.has(trimmed)) {
    return trimmed as TrainedTeacherEducationFormApiValue
  }
  return undefined
}

function resolveTrainedTeacherIpsCategory(program: Program): ProgramRegistrationIpsCategory | '' {
  const ips = program.ips
  if (ips === 'Inspire') return 'inspire'
  if (ips === 'Succeed') return 'succeed'
  if (ips === 'Prepare') return 'prepare'
  return ''
}

function resolveTrainedTeacherIpsDetail(
  program: Program,
  category: ProgramRegistrationIpsCategory | ''
): string | undefined {
  if (!category) return undefined
  if (category === 'prepare') return 'none'
  if (category === 'succeed') {
    const fromCategory = program.programCategory?.trim()
    if (!fromCategory) return 'none'
    return (
      PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(
        o => o.value === fromCategory || o.label === fromCategory
      )?.value ?? 'none'
    )
  }
  if (category === 'inspire') {
    const fromChannel = program.programChannel?.trim()
    if (!fromChannel) return 'none'
    return (
      PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
        o => o.value === fromChannel || o.label === fromChannel
      )?.value ?? 'none'
    )
  }
  return undefined
}

function rowIpsSummaries(nested: NonNullable<Program['generalCommonInfo']>): string[] {
  return [
    ...(nested.scheduleDetails ?? []).map(row => row.ipsTypeSummary?.trim() ?? ''),
    ...(nested.curriculumSessions ?? []).map(row => row.ipsTypeSummary?.trim() ?? ''),
  ].filter(Boolean)
}

function inferIpsScheduleDetail(
  nested: NonNullable<Program['generalCommonInfo']>
): 'common' | 'perSchedule' {
  if (nested.ipsScheduleDetail === 'perSchedule' || nested.ipsScheduleDetail === 'common') {
    return nested.ipsScheduleDetail
  }
  const root = nested.ipsTypeSummary?.trim() ?? ''
  if (root.includes('별')) return 'perSchedule'
  const rows = rowIpsSummaries(nested)
  if (rows.length === 0) return 'common'
  const unique = new Set(rows)
  return unique.size > 1 ? 'perSchedule' : 'common'
}

export type TrainedTeacherTypeSettingsApiEnrichment = Pick<
  NonNullable<Program['generalCommonInfo']>,
  'educationFormLabel' | 'educationFormScheduleDetail' | 'ipsScheduleDetail' | 'ipsTypeSummary'
>

/** nested 에 이미 저장된 label/summary 가 있으면 우선하고, 없을 때만 API top-level 로 보강한다. */
export function enrichTrainedTeachersTypeSettingsFromApi(
  program: Program,
  nested: NonNullable<Program['generalCommonInfo']>
): TrainedTeacherTypeSettingsApiEnrichment {
  const patch: TrainedTeacherTypeSettingsApiEnrichment = {}

  const storedEducationLabel = resolveStoredEducationFormLabel({
    educationFormLabel: nested.educationFormLabel,
    scheduleDetails: nested.scheduleDetails,
    curriculumSessions: nested.curriculumSessions,
  }).trim()

  const educationFormScheduleDetail =
    nested.educationFormScheduleDetail ??
    (storedEducationLabel && !nested.curriculumSessions?.some(s => s.educationFormLabel)
      ? 'common'
      : nested.curriculumSessions?.some(s => s.educationFormLabel) ||
          nested.scheduleDetails?.some(s => s.educationFormLabel)
        ? 'perSchedule'
        : 'common')

  if (!nested.educationFormScheduleDetail && educationFormScheduleDetail !== 'common') {
    patch.educationFormScheduleDetail = educationFormScheduleDetail
  }

  if (!storedEducationLabel && educationFormScheduleDetail === 'common') {
    const apiForm = normalizeTrainedTeacherEducationFormFromApiType(program.type)
    if (apiForm) {
      patch.educationFormLabel = educationFormLabelFromValue(apiForm)
    }
  }

  const ipsScheduleDetail = inferIpsScheduleDetail(nested)
  if (!nested.ipsScheduleDetail) {
    patch.ipsScheduleDetail = ipsScheduleDetail
  }

  const storedIpsSummary = resolveStoredIpsTypeSummary({
    ipsTypeSummary: nested.ipsTypeSummary,
    scheduleDetails: nested.scheduleDetails,
    curriculumSessions: nested.curriculumSessions,
  }).trim()

  if (!storedIpsSummary && ipsScheduleDetail === 'common') {
    const category = resolveTrainedTeacherIpsCategory(program)
    if (category) {
      const detail = resolveTrainedTeacherIpsDetail(program, category)
      patch.ipsTypeSummary = buildIpsTypeSummaryFull('common', category, detail)
    }
  }

  return patch
}
