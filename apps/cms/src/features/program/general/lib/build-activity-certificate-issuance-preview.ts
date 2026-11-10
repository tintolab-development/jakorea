import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { Program } from '@/types/domain'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'

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

/** 참여자 정보 마지막 줄(발급 목적) 기본값 — 발급 사유를 고르지 않는 기존 흐름 */
export const ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE = '기관 및 학교 제출용'

export function buildActivityCertificateParticipantInfo(
  instructor: ParticipatingInstructorRow,
  program?: Program | null,
  /** 발급 사유 모달에서 고른 사유 라벨 — 발급 문서 「발급목적」 줄에 기입 */
  issuanceReasonLabel?: string
): string {
  return [
    instructor.instructorName,
    instructor.birthDate ?? '-',
    instructor.schoolName,
    resolveProgramName(program),
    formatProgramPeriod(program),
    issuanceReasonLabel?.trim() || ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  ].join('\n')
}

export function buildActivityCertificateInitialStringValues(
  instructor: ParticipatingInstructorRow,
  program?: Program | null,
  issuanceReasonLabel?: string
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
    participantInfo: buildActivityCertificateParticipantInfo(
      instructor,
      program,
      issuanceReasonLabel
    ),
  }
}

/**
 * 파일명 포맷: [JA Korea] 활동인증서_김서연_260605 (빗금은 쉼표로 치환)
 * 날짜 = 발급일(서버 issuedAt, Asia/Seoul). 없으면 오늘.
 */
export function buildActivityCertificateFileName(
  participantName: string,
  date: Date | null = new Date()
): string {
  return `[JA Korea] ${ACTIVITY_CERTIFICATE_DOCUMENT_TITLE}_${participantName.replace(/[/\\]/g, ',')}_${formatAsiaSeoulYymmdd(date ?? new Date())}`
}

export function buildActivityCertificateParticipantInfoForVolunteer(
  volunteerName: string,
  options?: {
    birthDate?: string
    institutionName?: string
    program?: Program | null
  }
): string {
  return [
    volunteerName,
    options?.birthDate ?? '-',
    options?.institutionName ?? '-',
    resolveProgramName(options?.program),
    formatProgramPeriod(options?.program),
    ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  ].join('\n')
}

export function buildActivityCertificateInitialStringValuesForVolunteer(
  volunteerName: string,
  options?: {
    birthDate?: string
    institutionName?: string
    program?: Program | null
  }
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
    participantInfo: buildActivityCertificateParticipantInfoForVolunteer(volunteerName, options),
  }
}
