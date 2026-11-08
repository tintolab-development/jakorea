import type { Program } from '@/types/domain'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from './is-trained-teachers-primary-program'

function isTrainingLabel(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  return trimmed === TRAINED_TEACHER_TRAINING_SCHEDULE_NAME || trimmed === '교사 연수'
}

/**
 * 교육 연수 OFF이면 첫 진행 항목에 남은 「교육 연수」 라벨을 회차/차시 규칙으로 되돌린다.
 */
export function clearTeacherTrainingScheduleIfOff(
  common: NonNullable<Program['generalCommonInfo']>,
  options?: {
    teacherTrainingEnabled?: boolean
    teacherTrainingScheduleName?: string | null
  }
): NonNullable<Program['generalCommonInfo']> {
  const enabled = options?.teacherTrainingEnabled ?? common.teacherTrainingEnabled
  const scheduleName =
    options?.teacherTrainingScheduleName !== undefined
      ? options.teacherTrainingScheduleName
      : common.teacherTrainingScheduleName

  if (enabled === true) {
    return {
      ...common,
      teacherTrainingEnabled: true,
      teacherTrainingScheduleName:
        scheduleName?.trim() || TRAINED_TEACHER_TRAINING_SCHEDULE_NAME,
    }
  }

  if (enabled !== false) {
    return common
  }
  void scheduleName

  const next: NonNullable<Program['generalCommonInfo']> = {
    ...common,
    teacherTrainingEnabled: false,
    teacherTrainingScheduleName: '',
  }

  const sessions = next.curriculumSessions
  if (sessions?.[0] && (isTrainingLabel(sessions[0].title) || isTrainingLabel(sessions[0].sessionLabel))) {
    const first = sessions[0]
    const usesRound =
      first.sessionLabel?.includes('회차') === true ||
      sessions.some(session => session.sessionLabel?.includes('회차'))
    const roundLabel = usesRound ? '1회차' : '1차시'
    next.curriculumSessions = [
      {
        ...first,
        title: isTrainingLabel(first.title) ? '' : first.title,
        sessionLabel: isTrainingLabel(first.sessionLabel) ? roundLabel : first.sessionLabel,
      },
      ...sessions.slice(1),
    ]
  }

  const details = next.scheduleDetails
  if (
    details?.[0] &&
    (isTrainingLabel(details[0].name) || isTrainingLabel(details[0].scheduleLabel))
  ) {
    const first = details[0]
    next.scheduleDetails = [
      {
        ...first,
        name: isTrainingLabel(first.name) ? '' : first.name,
        scheduleLabel: isTrainingLabel(first.scheduleLabel)
          ? first.scheduleLabel.includes('행사')
            ? '행사 일정 01'
            : '세부 일정 01'
          : first.scheduleLabel,
      },
      ...details.slice(1),
    ]
  }

  return next
}
