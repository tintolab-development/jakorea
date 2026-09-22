import type { Program } from '@/types/domain'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from './is-trained-teachers-primary-program'

function isEmptyScheduleName(value: string | null | undefined): boolean {
  return value == null || value.trim() === ''
}

function isTrainingLabel(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  return trimmed === TRAINED_TEACHER_TRAINING_SCHEDULE_NAME || trimmed === '교사 연수'
}

/**
 * 교육 연수 OFF + GET 일정명이 빈 문자열이면 첫 진행 항목에 남은 「교육 연수」 라벨을 지운다.
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

  const next: NonNullable<Program['generalCommonInfo']> = {
    ...common,
    teacherTrainingEnabled: false,
    teacherTrainingScheduleName: isEmptyScheduleName(scheduleName) ? '' : scheduleName?.trim(),
  }

  if (!isEmptyScheduleName(scheduleName)) {
    return next
  }

  const sessions = next.curriculumSessions
  if (sessions?.[0] && isTrainingLabel(sessions[0].title)) {
    next.curriculumSessions = [{ ...sessions[0], title: '' }, ...sessions.slice(1)]
  }

  const details = next.scheduleDetails
  if (details?.[0] && isTrainingLabel(details[0].name)) {
    next.scheduleDetails = [{ ...details[0], name: '' }, ...details.slice(1)]
  }

  return next
}
