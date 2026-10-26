/**
 * 교육받은 교사 개발용 자동입력 — 등록 필수 검사에 남는 항목을 채운다.
 * 화면이 읽는 overlay 키와 검사 키가 달라도 둘 다 맞춘다.
 */
import { isDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import {
  listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons,
  type TrainedTeachersRegistrationRequiredFieldContext,
} from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-keys'

const TT_BASIC = 'trainedTeachersRegistration.basicInfo'
const TT_CURRICULUM = 'trainedTeachersRegistration.educationCurriculum'
const TT_SCHEDULE = 'trainedTeachersRegistration.educationScheduleSettings'
const TT_TYPE = 'trainedTeachersRegistration.typeSettings'
const GEN_BASIC = 'generalRegistration.basicInfo'
const GEN_CURRICULUM = 'generalRegistration.educationCurriculum'
const GEN_SCHEDULE_CURRICULUM = 'generalRegistration.educationScheduleCurriculum'
const GEN_TYPE = 'generalRegistration.typeSettings'

const TEACHER_TRAINING_NAME = '교육 연수'
const FALLBACK_IPS = { category: 'prepare', detail: 'none' } as const
const FALLBACK_GROUP_TIMES = [
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '13:30', endTime: '15:30' },
  { startTime: '09:30', endTime: '11:30' },
] as const

export type TrainedTeachersDevAutofillRequiredFallback = {
  scheduleLine: string
  titleEn: string
  publicTitle: string
  operationRange: { start: string; end: string }
  businessField: string
  educationCourse: string
  ipOwned: string
  courseDeliveredBy: string
  educationForm: string
  ips: { category: string; detail: string }
  unitName: string
  unitContent: string
  detailedProgramId: string
  detailedProgramName: string
  venueDetail: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function textAt(record: Record<string, unknown>, index: number): string {
  const value = record[index] ?? record[String(index)]
  return typeof value === 'string' ? value : ''
}

function writeBoth(
  overlay: Record<string, unknown>,
  trainedTeachersKey: string,
  generalKey: string,
  value: unknown
) {
  overlay[trainedTeachersKey] = value
  overlay[generalKey] = value
}

function mergeIndexText(
  overlay: Record<string, unknown>,
  trainedTeachersKey: string,
  generalKey: string,
  index: number,
  value: string
): boolean {
  const trained = isRecord(overlay[trainedTeachersKey]) ? overlay[trainedTeachersKey] : {}
  const general = isRecord(overlay[generalKey]) ? overlay[generalKey] : {}
  if (textAt(trained, index).trim() && textAt(general, index).trim()) return false
  const next: Record<number, string> = {}
  for (const source of [trained, general]) {
    for (const [key, item] of Object.entries(source)) {
      const parsed = Number(key)
      if (!Number.isFinite(parsed) || typeof item !== 'string') continue
      if (!next[parsed]?.trim()) next[parsed] = item
    }
  }
  next[index] = value
  writeBoth(overlay, trainedTeachersKey, generalKey, next)
  return true
}

function ensureIps(
  overlay: Record<string, unknown>,
  key: string,
  index: number | null,
  ips: { category: string; detail: string }
): boolean {
  if (index == null) {
    const current = overlay[key]
    if (isRecord(current) && typeof current.category === 'string' && current.category.trim()) {
      return false
    }
    overlay[key] = ips
    return true
  }
  const record = isRecord(overlay[key]) ? { ...overlay[key] } : {}
  const current = record[index] ?? record[String(index)]
  if (isRecord(current) && typeof current.category === 'string' && current.category.trim()) {
    return false
  }
  record[index] = ips
  overlay[key] = record
  return true
}

function ensureGroupTimes(
  overlay: Record<string, unknown>,
  index: number,
  groupCount: number
): boolean {
  const key = GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY
  const record = isRecord(overlay[key]) ? { ...overlay[key] } : {}
  const count = Math.max(1, groupCount)
  const slots = Array.from({ length: count }, (_, slotIndex) => {
    const sample = FALLBACK_GROUP_TIMES[slotIndex % FALLBACK_GROUP_TIMES.length]!
    return { startTime: sample.startTime, endTime: sample.endTime }
  })
  record[index] = slots
  overlay[key] = record
  return true
}

function ensureAssignmentPeriod(
  overlay: Record<string, unknown>,
  key: string,
  index: number,
  scheduleLine: string
): boolean {
  const record = isRecord(overlay[key]) ? { ...overlay[key] } : {}
  const current = record[index] ?? record[String(index)]
  const row: Record<string, unknown> = isRecord(current) ? { ...current } : { enabled: true }
  if (typeof row.period === 'string' && row.period.trim()) return false
  row.period = scheduleLine
  record[index] = row
  overlay[key] = record
  return true
}

function applyRequiredReason(
  overlay: Record<string, unknown>,
  reason: string,
  ctx: TrainedTeachersRegistrationRequiredFieldContext,
  fallback: TrainedTeachersDevAutofillRequiredFallback
): boolean {
  const indexed = /^(.+)\[(\d+)\]$/.exec(reason)
  const key = indexed?.[1] ?? reason
  const index = indexed ? Number(indexed[2]) : 0
  const line = fallback.scheduleLine
  const ips = fallback.ips.category.trim() ? fallback.ips : FALLBACK_IPS

  switch (key) {
    case 'basicInfo.programTitleEn':
      writeBoth(overlay, `${TT_BASIC}.programTitleEn`, `${GEN_BASIC}.programTitleEn`, fallback.titleEn)
      return true
    case 'basicInfo.publicProgramTitle':
      writeBoth(
        overlay,
        `${TT_BASIC}.publicProgramTitle`,
        `${GEN_BASIC}.publicProgramTitle`,
        fallback.publicTitle
      )
      return true
    case 'basicInfo.detailedProgram':
      if (!isDetailedProgramMasterId(fallback.detailedProgramId)) return false
      writeBoth(
        overlay,
        `${TT_BASIC}.detailedProgramId`,
        `${GEN_BASIC}.detailedProgramId`,
        fallback.detailedProgramId
      )
      writeBoth(
        overlay,
        `${TT_BASIC}.detailedProgramName`,
        `${GEN_BASIC}.detailedProgramName`,
        fallback.detailedProgramName
      )
      return true
    case 'basicInfo.operationRangeSeal':
      writeBoth(
        overlay,
        `${TT_BASIC}.operationRangeSeal`,
        `${GEN_BASIC}.operationRangeSeal`,
        { ...fallback.operationRange }
      )
      return true
    case 'basicInfo.businessField':
      writeBoth(
        overlay,
        `${TT_BASIC}.businessField`,
        `${GEN_BASIC}.businessField`,
        fallback.businessField
      )
      return true
    case 'basicInfo.educationVenueDetail':
      writeBoth(
        overlay,
        `${TT_BASIC}.educationVenueDetail`,
        `${GEN_BASIC}.educationVenueDetail`,
        fallback.venueDetail || '개발용 교육 장소'
      )
      return true
    case 'basicInfo.educationCourse':
      writeBoth(
        overlay,
        `${TT_BASIC}.educationCourse`,
        `${GEN_BASIC}.educationCourse`,
        fallback.educationCourse
      )
      return true
    case 'basicInfo.ipOwned':
      writeBoth(overlay, `${TT_BASIC}.ipOwned`, `${GEN_BASIC}.ipOwned`, fallback.ipOwned)
      return true
    case 'basicInfo.courseDeliveredBy':
      writeBoth(
        overlay,
        `${TT_BASIC}.courseDeliveredBy`,
        `${GEN_BASIC}.courseDeliveredBy`,
        fallback.courseDeliveredBy
      )
      return true
    case 'typeSettings.multiCommonEducationForm':
      writeBoth(
        overlay,
        `${TT_TYPE}.multiCommonEducationForm`,
        `${GEN_TYPE}.multiCommonEducationForm`,
        fallback.educationForm || 'online'
      )
      writeBoth(
        overlay,
        `${TT_TYPE}.educationForm`,
        `${GEN_TYPE}.singleEducationForm`,
        fallback.educationForm || 'online'
      )
      return true
    case 'typeSettings.ipsType':
      writeBoth(overlay, `${TT_TYPE}.ipsType`, `${GEN_TYPE}.ipsType`, ips)
      return true
    case 'curriculum.unitName':
      return mergeIndexText(
        overlay,
        `${TT_CURRICULUM}.unitNameBySession`,
        `${GEN_CURRICULUM}.unitNameBySession`,
        index,
        fallback.unitName
      )
    case 'curriculum.unitContent':
      return mergeIndexText(
        overlay,
        `${TT_CURRICULUM}.unitContentBySession`,
        `${GEN_CURRICULUM}.unitContentBySession`,
        index,
        fallback.unitContent
      )
    case 'curriculum.progressSession':
      return mergeIndexText(
        overlay,
        `${TT_CURRICULUM}.progressSessionByRound`,
        `${GEN_CURRICULUM}.progressSessionByRound`,
        index,
        String(index)
      )
    case 'curriculum.roundContent':
      return mergeIndexText(
        overlay,
        `${TT_CURRICULUM}.roundContentByRound`,
        `${GEN_CURRICULUM}.roundContentByRound`,
        index,
        fallback.unitContent
      )
    case 'curriculum.ips':
      ensureIps(overlay, `${TT_CURRICULUM}.ipsBySession`, index, ips)
      ensureIps(overlay, `${GEN_CURRICULUM}.ipsBySession`, index, ips)
      return true
    case 'curriculum.assignment':
      return ensureAssignmentPeriod(
        overlay,
        `${GEN_CURRICULUM}.assignmentByRound`,
        index,
        line
      )
    case 'curriculum.preEducationScheduleName':
      writeBoth(
        overlay,
        `${TT_CURRICULUM}.preEducationScheduleName`,
        `${GEN_CURRICULUM}.preEducationScheduleName`,
        TEACHER_TRAINING_NAME
      )
      return true
    case 'curriculum.preEducationScheduleLine':
      writeBoth(
        overlay,
        `${TT_CURRICULUM}.preEducationScheduleName`,
        `${GEN_CURRICULUM}.preEducationScheduleName`,
        TEACHER_TRAINING_NAME
      )
      writeBoth(
        overlay,
        `${TT_CURRICULUM}.preEducationScheduleLine`,
        `${GEN_CURRICULUM}.preEducationScheduleLine`,
        line
      )
      writeBoth(
        overlay,
        `${TT_CURRICULUM}.teacherTrainingEducationForm`,
        `${GEN_CURRICULUM}.teacherTrainingEducationForm`,
        fallback.educationForm || 'online'
      )
      return true
    case 'scheduleCurriculum.eventName':
      return mergeIndexText(
        overlay,
        `${GEN_SCHEDULE_CURRICULUM}.eventNameByDetail`,
        `${GEN_SCHEDULE_CURRICULUM}.eventNameByDetail`,
        index,
        fallback.unitName
      )
    case 'scheduleCurriculum.scheduleDate':
      return mergeIndexText(
        overlay,
        `${GEN_SCHEDULE_CURRICULUM}.scheduleDateByDetailIso`,
        `${GEN_SCHEDULE_CURRICULUM}.scheduleDateByDetailIso`,
        index,
        line
      )
    case 'scheduleCurriculum.groupTimes':
      return ensureGroupTimes(
        overlay,
        index,
        ctx.sessionRoundType === 'multi' ? 1 : ctx.scheduleCurriculumGroupCount
      )
    case 'scheduleCurriculum.ips':
      return ensureIps(overlay, `${GEN_SCHEDULE_CURRICULUM}.ipsByDetailIndex`, index, ips)
    case 'scheduleCurriculum.assignment':
      return ensureAssignmentPeriod(
        overlay,
        `${GEN_SCHEDULE_CURRICULUM}.assignmentByDetail`,
        index,
        line
      )
    case 'scheduleCurriculum.preEducationName':
      overlay[`${GEN_SCHEDULE_CURRICULUM}.preEducationName`] = TEACHER_TRAINING_NAME
      return true
    case 'scheduleCurriculum.preEducationScheduleDate':
      overlay[`${GEN_SCHEDULE_CURRICULUM}.preEducationName`] = TEACHER_TRAINING_NAME
      return mergeIndexText(
        overlay,
        `${GEN_SCHEDULE_CURRICULUM}.scheduleDateByDetailIso`,
        `${GEN_SCHEDULE_CURRICULUM}.scheduleDateByDetailIso`,
        0,
        line
      )
    case 'educationScheduleSettings.periodDateIso':
    case 'educationScheduleSettings.singleDateIso':
      writeBoth(
        overlay,
        `${TT_SCHEDULE}.scheduleLines`,
        GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
        [line]
      )
      return true
    default:
      return false
  }
}

/**
 * 자동입력 overlay를 교육받은 교사 필수 검사에 맞춘다.
 * 채울 수 없는 항목(세부 프로그램 마스터 id 없음 등)은 그대로 둔다.
 */
export function completeTrainedTeachersDevAutofillOverlay(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext,
  fallback: TrainedTeachersDevAutofillRequiredFallback
): Record<string, unknown> {
  const next = { ...overlay }
  for (let pass = 0; pass < 4; pass += 1) {
    const reasons = listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(next, ctx)
    if (reasons.length === 0) return next
    let changed = false
    for (const reason of reasons) {
      if (applyRequiredReason(next, reason, ctx, fallback)) changed = true
    }
    if (!changed) return next
  }
  return next
}
