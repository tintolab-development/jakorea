import { readServerManAge } from '@/features/user/api/format-gender-birth-display'

/**
 * 참여자 목록·과제 제출 행의 서버 만 나이(age, 2026-11-12 BE 추가).
 * 숫자가 아니면 undefined — FE가 마스킹 생년월일로 나이를 계산하지 않는다.
 */
export function readParticipantManAge(dto: unknown): number | undefined {
  return readServerManAge(dto)
}
