import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { Program } from '@/types/domain'

export const ACTIVITY_CERTIFICATE_DOCUMENT_TITLE = '활동인증서'

export const ACTIVITY_CERTIFICATE_BODY_CONTENT =
  '귀하는 위 프로그램에서 교육진행자로 참여하여\n교육 활동을 수행하였음을 확인합니다.'

function formatDateValue(value: Program['startDate'] | undefined): string | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function formatProgramPeriod(program?: Program | null): string {
  const start = formatDateValue(program?.startDate)
  const end = formatDateValue(program?.endDate)
  if (start && end) return `${start} ~ ${end}`
  return '2026.01.01 ~ 2026.12.31'
}

function resolveProgramName(program?: Program | null): string {
  return program?.mainTitle?.trim() || program?.title?.trim() || 'JA Korea 경제교육 프로그램'
}

export function buildActivityCertificateParticipantInfo(
  instructor: ParticipatingInstructorRow,
  program?: Program | null
): string {
  return [
    instructor.instructorName,
    instructor.birthDate ?? '-',
    instructor.schoolName,
    resolveProgramName(program),
    formatProgramPeriod(program),
    '기관 및 학교 제출용',
  ].join('\n')
}

export function buildActivityCertificateInitialStringValues(
  instructor: ParticipatingInstructorRow,
  program?: Program | null
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
    participantInfo: buildActivityCertificateParticipantInfo(instructor, program),
  }
}

/** 파일명 포맷: 활동인증서_김서연_260605 */
export function buildActivityCertificateFileName(instructorName: string, date = new Date()): string {
  const y = String(date.getFullYear()).slice(2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${ACTIVITY_CERTIFICATE_DOCUMENT_TITLE}_${instructorName}_${y}${m}${d}`
}
