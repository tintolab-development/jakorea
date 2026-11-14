import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import {
  PROGRAM_SCHEDULE_WIDGET_KEYS,
  type ProgramScheduleKind,
} from '@/features/dashboard/model/program-schedule-keys'

const SCHEDULE_KIND_ORDER: readonly ProgramScheduleKind[] = [
  'general',
  'company_school',
  'ujat',
  'gemini',
  'trained_teacher',
]

export type { ProgramScheduleKind }
export { PROGRAM_SCHEDULE_WIDGET_KEYS }

export function isGeminiProgram(program: Program): boolean {
  const t = `${program.title ?? ''}${program.mainTitle ?? ''}`
  return t.includes('제미나이')
}

export function getGeneralEducationPrograms(): Program[] {
  return []
}

export function getGeminiPrograms(): Program[] {
  return []
}

export function getUjatPrograms(): Program[] {
  return []
}

export function getProgramScheduleKindsForAdminUser(
  user: Omit<User, 'password'> | null
): ProgramScheduleKind[] {
  if (!user || user.role !== 'ADMIN') {
    return []
  }
  return [...SCHEDULE_KIND_ORDER]
}
