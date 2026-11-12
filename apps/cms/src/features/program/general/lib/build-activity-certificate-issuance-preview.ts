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
  program?: Program | null
  /**
   * 참여기간 — 본인의 진행 완료된 첫 일정일 ~ 마지막 일정일(기획 회신 261113).
   * 서버 값이 아직 없어 비워 두면 '-'.
   */
  participationPeriod?: string | null
  /** 활동시수 — 진행 완료 일정의 실제 교육 시간 합계('총 N시간 M분'). 서버 값이 없으면 '-' */
  activityHours?: string | null
  /** 발급 사유 모달에서 고른 사유 라벨 — 「발급목적」 줄 */
  issuanceReasonLabel?: string
}

/**
 * 활동인증서 참여자 정보 5줄(강사·봉사자 공통, CMS-FUNC-0265):
 * 성명 · 프로그램명 · 참여기간 · 활동시수 · 발급목적. 줄 순서는
 * `ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS`와 같다.
 */
export function buildActivityCertificateParticipantInfoLines(
  input: ActivityCertificateParticipantInfoInput
): string {
  return [
    valueOrEmpty(input.name),
    resolveProgramName(input.program),
    valueOrEmpty(input.participationPeriod),
    valueOrEmpty(input.activityHours),
    input.issuanceReasonLabel?.trim() || ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  ].join('\n')
}

export function buildActivityCertificateParticipantInfo(
  instructor: ParticipatingInstructorRow,
  program?: Program | null,
  /** 발급 사유 모달에서 고른 사유 라벨 — 발급 문서 「발급목적」 줄에 기입 */
  issuanceReasonLabel?: string
): string {
  return buildActivityCertificateParticipantInfoLines({
    name: instructor.instructorName,
    program,
    issuanceReasonLabel,
  })
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

export type ActivityCertificateVolunteerOptions = {
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
    program: options?.program,
    issuanceReasonLabel: options?.issuanceReasonLabel,
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
