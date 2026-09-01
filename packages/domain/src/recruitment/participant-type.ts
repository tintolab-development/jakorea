import { getLabel } from '../shared/option-helpers'
import type { DomainSelectOption } from '../shared/types'

export const PARTICIPANT_TYPE = {
  schoolInstitution: 'school_institution',
  individual: 'individual',
  teacherInstructor: 'teacher_instructor',
  volunteer: 'volunteer',
} as const

export type ParticipantType = (typeof PARTICIPANT_TYPE)[keyof typeof PARTICIPANT_TYPE]

export const PARTICIPANT_TYPE_OPTIONS: DomainSelectOption<ParticipantType>[] = [
  { value: PARTICIPANT_TYPE.schoolInstitution, label: '학교/기관' },
  { value: PARTICIPANT_TYPE.individual, label: '개인' },
  { value: PARTICIPANT_TYPE.teacherInstructor, label: '교사/강사' },
  { value: PARTICIPANT_TYPE.volunteer, label: '봉사자' },
]

export function getParticipantTypeLabel(value: ParticipantType): string {
  return getLabel(PARTICIPANT_TYPE_OPTIONS, value)
}
