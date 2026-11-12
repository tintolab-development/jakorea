/**
 * TT 등록 모집 필수검사. Overlay store를 읽지 않고 typed recruitment를 본다.
 * 비노출 사전안내·최대강사 수는 검사하지 않는다.
 */
import {
  buildInstitutionApplicationRecruitLimitVisibilityBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowTrainedTeachersInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'
import type { TrainedTeachersRecruitFormState } from './registration-canonical-types'
import { serializeTrainedTeachersRecruitmentForFormVersion } from './registration-rhf-recruitment'
import type { TrainedTeachersRegistrationRhfValues } from './registration-rhf-values'

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function isEmptyStringList(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.every(item => isEmptyText(item))
}

function isRangeIncomplete(value: TrainedTeachersRecruitFormState['programRangeSeal']): boolean {
  if (value == null) return true
  return isEmptyText(value.start) || isEmptyText(value.end)
}

export function listIncompleteTrainedTeachersRecruitmentRequiredFields(
  values: Pick<
    TrainedTeachersRegistrationRhfValues,
    'recruitment' | 'educationStructure' | 'sessionRound' | 'educationScheduleMode'
  >
): string[] {
  const recruit = values.recruitment
  const reasons: string[] = []
  const p = 'recruit.institution'
  if (isEmptyText(recruit.announcementPublished)) reasons.push(`${p}.announcementPublished`)
  if (isEmptyText(recruit.studentListRequired)) reasons.push(`${p}.studentListRequired`)
  if (isEmptyNumber(recruit.maxClassCount)) reasons.push(`${p}.maxClassCount`)
  const bridge = buildInstitutionApplicationRecruitLimitVisibilityBridge({
    educationStructure: values.educationStructure,
    sessionRound: values.sessionRound,
    educationScheduleMode: values.educationScheduleMode,
  })
  if (shouldShowInstitutionApplicationMaxScheduleFields(bridge) && isEmptyNumber(recruit.maxScheduleCount)) {
    reasons.push(`${p}.maxScheduleCount`)
  }
  // TT: 커리큘럼형(단일·복수) + 기간 지정 — Platform 「희망 차시」 셀렉 조건과 동일
  if (
    shouldShowTrainedTeachersInstitutionApplicationMaxSessionsPerDayField(bridge) &&
    isEmptyNumber(recruit.maxSessionsPerDay)
  ) {
    reasons.push(`${p}.maxSessionsPerDay`)
  }
  if (isRangeIncomplete(recruit.programRangeSeal)) reasons.push(`${p}.programRangeSeal`)
  if (isEmptyStringList(recruit.targetLevels)) reasons.push(`${p}.targetLevels`)
  if (isEmptyText(recruit.targetLevelDetail)) reasons.push(`${p}.targetLevelDetail`)
  if (isRangeIncomplete(recruit.recruitRangeSeal)) reasons.push(`${p}.recruitRangeSeal`)
  if (isEmptyText(recruit.finalAnnounceIso)) reasons.push(`${p}.finalAnnounceIso`)
  if (isEmptyText(recruit.finalAnnounceMethod)) reasons.push(`${p}.finalAnnounceMethod`)
  if (isEmptyText(recruit.inquiryContact)) reasons.push(`${p}.inquiryContact`)
  if (isEmptyText(recruit.inquiryTel)) reasons.push(`${p}.inquiryTel`)
  if (isEmptyText(recruit.inquiryEmail)) reasons.push(`${p}.inquiryEmail`)
  if (recruit.notesNotApplicable !== true && isEmptyText(recruit.notes)) reasons.push(`${p}.notes`)
  return reasons
}

export function hasIncompleteTrainedTeachersRecruitmentRequiredFields(
  values: Pick<
    TrainedTeachersRegistrationRhfValues,
    'recruitment' | 'educationStructure' | 'sessionRound' | 'educationScheduleMode'
  >
): boolean {
  return listIncompleteTrainedTeachersRecruitmentRequiredFields(values).length > 0
}

export function describeIncompleteTrainedTeachersRecruitmentRequiredFields(
  values: Pick<
    TrainedTeachersRegistrationRhfValues,
    'recruitment' | 'educationStructure' | 'sessionRound' | 'educationScheduleMode'
  >
): string | null {
  const keys = listIncompleteTrainedTeachersRecruitmentRequiredFields(values)
  return keys.length > 0 ? keys.join(', ') : null
}

/** 충돌 테스트용 — serializer가 RHF 값을 그대로 내보내는지 확인 */
export function projectTrainedTeachersRecruitmentForCompare(
  values: TrainedTeachersRegistrationRhfValues
): Record<string, unknown> {
  return serializeTrainedTeachersRecruitmentForFormVersion(values.recruitment)
}
