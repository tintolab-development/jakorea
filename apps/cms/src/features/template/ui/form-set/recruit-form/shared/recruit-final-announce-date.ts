import type { Dayjs } from 'dayjs'

/**
 * 최종 합격자 발표일 — 모집 종료일 이후(당일 포함)만 고를 수 있다(QA-0124).
 * 모집 기간을 아직 고르지 않았으면 제한하지 않는다. 사업 운영 기간 제한은 등록 모달 Provider 가 따로 합성한다.
 */
export function createFinalAnnounceDisabledDate(
  recruitRange: readonly [Dayjs, Dayjs] | null | undefined
): ((date: Dayjs) => boolean) | undefined {
  const recruitEnd = recruitRange?.[1]
  if (recruitEnd == null || !recruitEnd.isValid()) return undefined
  return (date: Dayjs) => date.isBefore(recruitEnd, 'day')
}
