/**
 * UJAT 하반기 봉사자 모집 — 모집 공고 노출 시점 (관리자 설정)
 * @see apps/cms/.cursor/rules/process/ujat-program-detail-recruitment-tabs.md
 *
 * TODO(api): 프로그램·회차(하반기) API 필드 연동 후 `getUjatVolunteerNoticeExposureReadLabel`에 실제 설정값 전달.
 * 공고는 선택한 시점(모집 시작일 / 하루 전 / 일주일 전)에 맞춰 등록·노출된다.
 */
export const UJAT_VOLUNTEER_NOTICE_EXPOSURE_VALUES = [
  'start-day',
  'one-day-before',
  'one-week-before',
] as const
export type UjatVolunteerNoticeExposureValue = (typeof UJAT_VOLUNTEER_NOTICE_EXPOSURE_VALUES)[number]
export const UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS: ReadonlyArray<{
  label: string
  value: UjatVolunteerNoticeExposureValue
}> = [
  { label: '모집 시작일', value: 'start-day' },
  { label: '모집 하루 전', value: 'one-day-before' },
  { label: '모집 일주일 전', value: 'one-week-before' },
] as const
const LABEL_BY_VALUE: Record<UjatVolunteerNoticeExposureValue, string> = {
  'start-day': '모집 시작일',
  'one-day-before': '모집 하루 전',
  'one-week-before': '모집 일주일 전' }
export function isUjatVolunteerNoticeExposureValue(
  value: string | null | undefined
): value is UjatVolunteerNoticeExposureValue {
  return (
    value != null &&
    (UJAT_VOLUNTEER_NOTICE_EXPOSURE_VALUES as readonly string[]).includes(value)
  )
}
/** 프로그램 상세 조회 — 설정값에 맞는 라벨 (미연동 시 기본: 모집 시작일) */
export function getUjatVolunteerNoticeExposureReadLabel(
  setting: string | null | undefined
): string {
  if (isUjatVolunteerNoticeExposureValue(setting)) {
    return LABEL_BY_VALUE[setting]
  }
  return LABEL_BY_VALUE['start-day']
}