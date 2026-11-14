import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { Program } from '@/types/domain'
import { ACTIVITY_CERTIFICATE_BODY_CONTENT } from '@/features/template/lib/certificate-body-content'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'

export const ACTIVITY_CERTIFICATE_DOCUMENT_TITLE = '활동인증서'

/** 자동입력 데이터가 없는 항목 표시 (CMS-FUNC-0631) */
export const ACTIVITY_CERTIFICATE_EMPTY_VALUE = '-'

function valueOrEmpty(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : ACTIVITY_CERTIFICATE_EMPTY_VALUE
}

function resolveProgramName(program?: Program | null): string {
  return valueOrEmpty(program?.mainTitle?.trim() || program?.title)
}

/** 참여자 정보 마지막 줄(발급 목적) 기본값 — 발급 사유를 고르지 않는 흐름 */
export const ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE = '기관 및 학교 제출용'

export type ActivityCertificateParticipantInfoInput = {
  name: string | null | undefined
  /** 생년월일 — 원문 조회(unmask) 값. 없으면 '-' */
  birthDate?: string | null
  /** 소속 — 참여자 소속 학교/기관명. 없으면 '-' */
  affiliation?: string | null
  program?: Program | null
  /**
   * 참여기간 — 본인의 진행 완료된 첫 일정일 ~ 마지막 일정일(기획 회신 261113).
   * 서버 값이 아직 없어 비워 두면 '-'.
   */
  participationPeriod?: string | null
  /** 발급 사유 모달에서 고른 사유 라벨 — 「발급목적」 줄 */
  issuanceReasonLabel?: string
}

function birthDateOrEmpty(value: string | null | undefined): string {
  return valueOrEmpty(value?.replace(/\s/g, ''))
}

/**
 * 활동인증서 참여자 정보 6줄(강사·봉사자 공통, 시안 5767:46959·5767:47403 — 사용자 결정 261113):
 * 성명 · 생년월일 · 소속 · 프로그램명 · 활동기간 · 발급목적. 줄 순서는
 * `ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS`와 같다.
 */
export function buildActivityCertificateParticipantInfoLines(
  input: ActivityCertificateParticipantInfoInput
): string {
  return [
    valueOrEmpty(input.name),
    birthDateOrEmpty(input.birthDate),
    valueOrEmpty(input.affiliation),
    resolveProgramName(input.program),
    valueOrEmpty(input.participationPeriod),
    input.issuanceReasonLabel?.trim() || ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  ].join('\n')
}

/** 서버 계산값(eligibility)을 표시 문구로 바꾼 참여기간(「활동기간」 줄) */
export type ActivityCertificatePeriodHoursText = {
  participationPeriod?: string | null
}

export function buildActivityCertificateParticipantInfo(
  instructor: ParticipatingInstructorRow,
  program?: Program | null,
  /** 발급 사유 모달에서 고른 사유 라벨 — 발급 문서 「발급목적」 줄에 기입 */
  issuanceReasonLabel?: string,
  periodHours?: ActivityCertificatePeriodHoursText
): string {
  return buildActivityCertificateParticipantInfoLines({
    name: instructor.instructorName,
    birthDate: instructor.birthDate,
    affiliation: instructor.affiliation,
    program,
    issuanceReasonLabel,
    participationPeriod: periodHours?.participationPeriod,
  })
}

export function buildActivityCertificateInitialStringValues(
  instructor: ParticipatingInstructorRow,
  program?: Program | null,
  issuanceReasonLabel?: string,
  periodHours?: ActivityCertificatePeriodHoursText
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
    participantInfo: buildActivityCertificateParticipantInfo(
      instructor,
      program,
      issuanceReasonLabel,
      periodHours
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

export type ActivityCertificateVolunteerOptions = ActivityCertificatePeriodHoursText & {
  /** 생년월일 — 원문 조회(unmask) 값 */
  birthDate?: string | null
  /** 소속 학교/기관명 */
  affiliation?: string | null
  program?: Program | null
  /** 발급 사유 모달에서 고른 사유 라벨 — 「발급목적」 줄 */
  issuanceReasonLabel?: string
}

export function buildActivityCertificateParticipantInfoForVolunteer(
  volunteerName: string,
  options?: ActivityCertificateVolunteerOptions
): string {
  return buildActivityCertificateParticipantInfoLines({
    name: volunteerName,
    birthDate: options?.birthDate,
    affiliation: options?.affiliation,
    program: options?.program,
    issuanceReasonLabel: options?.issuanceReasonLabel,
    participationPeriod: options?.participationPeriod,
  })
}

export function buildActivityCertificateInitialStringValuesForVolunteer(
  volunteerName: string,
  options?: ActivityCertificateVolunteerOptions
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
    participantInfo: buildActivityCertificateParticipantInfoForVolunteer(volunteerName, options),
  }
}
