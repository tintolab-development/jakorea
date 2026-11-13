import type { CertificateEligibilityResponse } from '@/shared/api/generated/forms-surveys/schemas/certificateEligibilityResponse'

/** `GET /api/admin/certificates/eligibility` certificateType — 활동인증서 */
export const CERTIFICATE_ELIGIBILITY_TYPE_INSTRUCTOR_ACTIVITY = 'INSTRUCTOR_ACTIVITY' as const
export const CERTIFICATE_ELIGIBILITY_TYPE_VOLUNTEER_ACTIVITY = 'VOLUNTEER_ACTIVITY' as const

export type ActivityCertificateEligibilityType =
  | typeof CERTIFICATE_ELIGIBILITY_TYPE_INSTRUCTOR_ACTIVITY
  | typeof CERTIFICATE_ELIGIBILITY_TYPE_VOLUNTEER_ACTIVITY

/**
 * BE 추가 필드(활동인증서 유형에서만 채워짐). 코드젠 스냅샷에 아직 없어 여기서 확장한다.
 * BE 배포 전에는 응답에 없을 수 있다 → 표시 '-'.
 */
export type ActivityCertificateEligibilityResponse = CertificateEligibilityResponse & {
  /** 진행 완료된 본인 일정 시간 합계(분). 일정이 없으면 0 */
  activityMinutes?: number | null
  /** 진행 완료된 첫 일정일 `YYYY-MM-DD`(Asia/Seoul). 없으면 null */
  participationStartDate?: string | null
  /** 진행 완료된 마지막 일정일 `YYYY-MM-DD`. 하루뿐이면 시작일과 같다 */
  participationEndDate?: string | null
}

const EMPTY = '-'
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** `YYYY-MM-DD` → `YYYY.MM.DD`. 타임존 변환을 피하려고 Date로 파싱하지 않는다 */
function formatIsoDateText(value: string | null | undefined): string | null {
  const match = value?.trim().match(ISO_DATE)
  if (!match) return null
  return `${match[1]}.${match[2]}.${match[3]}`
}

/**
 * 활동시수 표시(기획 회신 261113) — null·0 → '-', 60의 배수 → '총 N시간',
 * 1시간 미만 → '총 M분', 그 외 → '총 N시간 M분'.
 */
export function formatActivityCertificateHours(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return EMPTY
  const total = Math.trunc(minutes)
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (rest === 0) return `총 ${hours}시간`
  if (hours === 0) return `총 ${rest}분`
  return `총 ${hours}시간 ${rest}분`
}

/** 참여기간 표시 — 둘 다 없음 → '-', 같은 날 → 'YYYY.MM.DD', 다르면 'YYYY.MM.DD ~ YYYY.MM.DD' */
export function formatActivityCertificateParticipationPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const start = formatIsoDateText(startDate)
  const end = formatIsoDateText(endDate)
  if (start == null && end == null) return EMPTY
  if (start == null || end == null || start === end) return (start ?? end) as string
  return `${start} ~ ${end}`
}

export type ActivityCertificatePeriodHours = {
  participationPeriod: string
  activityHours: string
}

export const EMPTY_ACTIVITY_CERTIFICATE_PERIOD_HOURS: ActivityCertificatePeriodHours = {
  participationPeriod: EMPTY,
  activityHours: EMPTY,
}

export function resolveActivityCertificatePeriodHours(
  eligibility: ActivityCertificateEligibilityResponse | null | undefined
): ActivityCertificatePeriodHours {
  if (eligibility == null) return EMPTY_ACTIVITY_CERTIFICATE_PERIOD_HOURS
  return {
    participationPeriod: formatActivityCertificateParticipationPeriod(
      eligibility.participationStartDate,
      eligibility.participationEndDate
    ),
    activityHours: formatActivityCertificateHours(eligibility.activityMinutes),
  }
}
