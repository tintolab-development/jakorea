/**
 * BE 중복 키 SSOT (Gemini training-report import):
 * programId + instructorIdentity + trainingDate + trainingStartTime + trainingLocation
 * (location 없으면 schoolOrOrganizationName)
 *
 * instructorIdentity:
 * - M:{memberId} — 매칭된 강사 회원
 * - BLANK — 이름·연락처 모두 미기재
 * - U:{정규화이름}|{phoneDigits} — 이름/연락처 있으나 회원 미매칭
 */

import { isGeminiInstructorIdentityBlank } from './instructor-identity'

export function normalizeGeminiTrainingClock(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''
  const hm = /^(\d{1,2}):(\d{2})/.exec(trimmed)
  if (!hm) return trimmed
  return `${hm[1]!.padStart(2, '0')}:${hm[2]}`
}

export function normalizeGeminiInstructorNameForMatch(
  raw: string | null | undefined
): string {
  const name = (raw ?? '').trim()
  if (!name || name === '-' || name === '미기재') return ''
  return name
}

export function normalizeGeminiPhoneDigits(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '')
}

export function buildGeminiInstructorIdentityKey(input: {
  instructorMemberId?: number | string | null
  instructorName?: string | null
  instructorPhone?: string | null
}): string {
  const memberRaw = input.instructorMemberId
  const memberId =
    memberRaw == null || memberRaw === ''
      ? NaN
      : typeof memberRaw === 'number'
        ? memberRaw
        : Number(memberRaw)
  if (Number.isFinite(memberId) && memberId > 0) {
    return `M:${memberId}`
  }
  const name = normalizeGeminiInstructorNameForMatch(input.instructorName)
  const phoneDigits = normalizeGeminiPhoneDigits(input.instructorPhone)
  if (isGeminiInstructorIdentityBlank(name, phoneDigits) || (!name && !phoneDigits)) {
    return 'BLANK'
  }
  return `U:${name}|${phoneDigits}`
}

export function resolveGeminiTrainingLocationForMatch(input: {
  trainingLocation?: string | null
  schoolOrOrganizationName?: string | null
}): string {
  const location = input.trainingLocation?.trim()
  if (location) return location
  return input.schoolOrOrganizationName?.trim() ?? ''
}

/** BE와 동일 조합의 중복 판별 키 */
export function buildGeminiPerformanceServerMatchKey(input: {
  programId?: number | string | null
  trainingDate?: string | null
  trainingLocation?: string | null
  schoolOrOrganizationName?: string | null
  trainingStartTime?: string | null
  instructorMemberId?: number | string | null
  instructorName?: string | null
  instructorPhone?: string | null
}): string {
  const programId =
    input.programId == null || input.programId === ''
      ? ''
      : String(input.programId)
  return [
    programId,
    buildGeminiInstructorIdentityKey(input),
    (input.trainingDate ?? '').trim(),
    normalizeGeminiTrainingClock(input.trainingStartTime),
    resolveGeminiTrainingLocationForMatch(input),
  ].join('|')
}
