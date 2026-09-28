/**
 * 프로그램 목록 「참여자 모집 인원」.
 *
 * 전 유형이 같은 서버 필드만 쓴다. programType으로 분자·분모를 바꾸지 않는다.
 * - 분자: `participantApprovedCount` (없으면 0)
 * - 분모: `participantCapacity` (`participantRecruitmentCount` 별칭, 없으면 `-`)
 *
 * 학생 수·학교 수·강사/봉사 정원·회차 capacity 합·상세 KPI는 이 칸에 넣지 않는다.
 */

export type ListParticipantRecruitmentSource = {
  participantApprovedCount?: number | null
  participantCapacity?: number | null
  participantRecruitmentCount?: number | null
}

function toOptionalCount(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** 목록 item의 참여자 모집 인원만 매핑한다. 다른 카운트로 대체하지 않는다. */
export function mapListParticipantRecruitment(dto: ListParticipantRecruitmentSource): {
  participantApprovedCount?: number
  participantCapacity?: number
} {
  return {
    participantApprovedCount: toOptionalCount(dto.participantApprovedCount),
    participantCapacity:
      toOptionalCount(dto.participantCapacity) ?? toOptionalCount(dto.participantRecruitmentCount),
  }
}

/** `{approved} / {capacity}`. capacity가 없으면 `{approved} / -`. */
export function formatRecruitmentHeadcount(
  approved: number | null | undefined,
  capacity: number | null | undefined
): string {
  const numerator = approved == null || !Number.isFinite(approved) ? 0 : approved
  if (capacity == null || !Number.isFinite(capacity)) return `${numerator} / -`
  return `${numerator} / ${capacity}`
}
