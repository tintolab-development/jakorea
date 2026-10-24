/**
 * TT 등록 신청정보 검사. Overlay store를 읽지 않고 typed application을 본다.
 * 신규 필수 정책을 만들지 않는다. 숨김 단락·동의 schema requiredMark는 검사하지 않는다.
 * 학급/일정 제한 초과는 오류 키만 보고하고, 단계 이동 차단은 기존 제3자 동의 정책만 유지한다.
 */
import type { TrainedTeachersRegistrationRhfValues } from './registration-rhf-values'
import { persistableTrainedTeachersPreferredSchedules } from './registration-rhf-application'

function isPreferredScheduleHidden(
  values: Pick<TrainedTeachersRegistrationRhfValues, 'educationStructure' | 'sessionRound'>
): boolean {
  return values.educationStructure === 'schedule' && values.sessionRound === 'multi'
}

export function listIncompleteTrainedTeachersApplicationRequiredFields(
  values: Pick<
    TrainedTeachersRegistrationRhfValues,
    'application' | 'recruitment' | 'educationStructure' | 'sessionRound'
  >
): string[] {
  const reasons: string[] = []
  const classCount = values.application.basicInfo.classCount.trim()
  const maxClassCount = values.recruitment.maxClassCount
  if (
    classCount !== '' &&
    maxClassCount != null &&
    maxClassCount > 0 &&
    Number(classCount) > maxClassCount
  ) {
    reasons.push('application.trainedTeachers.basicInfo.classCount')
  }

  if (!isPreferredScheduleHidden(values)) {
    const persisted = persistableTrainedTeachersPreferredSchedules(
      values.application.preferredSchedules
    )
    const maxScheduleCount = values.recruitment.maxScheduleCount
    if (
      maxScheduleCount != null &&
      maxScheduleCount > 0 &&
      persisted.length > maxScheduleCount
    ) {
      reasons.push('application.trainedTeachers.preferredSchedules')
    }
    const maxSessionsPerDay = values.recruitment.maxSessionsPerDay
    if (
      maxSessionsPerDay != null &&
      maxSessionsPerDay > 0 &&
      persisted.some(block => block.times.length > maxSessionsPerDay)
    ) {
      reasons.push('application.trainedTeachers.preferredSchedules.times')
    }
  }

  return reasons
}
