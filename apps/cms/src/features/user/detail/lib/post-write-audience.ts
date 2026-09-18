/**
 * 게시글 공개 범위 — UI 라벨은 고정, API 값은 프로그램 유형에 따라 매핑.
 *
 * UI: 전체 / 참여자 / 강사 / 봉사자
 * API `visibilityType` (comma / ALL):
 * - 참여자 + 기관 프로그램 → TEACHER (담당교사·신청자)
 * - 참여자 + 개인 프로그램 → STUDENT (학생·개인 참여자)
 * - 강사 → INSTRUCTOR
 * - 봉사자 → VOLUNTEER
 * - 전체 → ALL
 */

import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import type { Program } from '@/types/domain'

export type PostWriteAudienceApiKey = 'all' | 'teacher' | 'student' | 'instructor' | 'volunteer'

/** UI「참여자」체크에 대응하는 API 키 */
export function resolveParticipantAudienceApiKey(
  program?: Program
): 'teacher' | 'student' {
  return program && isGeneralIndividualProgram(program) ? 'student' : 'teacher'
}

export function buildPostWriteAudienceOptions(program?: Program): Array<{
  label: string
  value: PostWriteAudienceApiKey
}> {
  const participantKey = resolveParticipantAudienceApiKey(program)
  return [
    { label: '전체', value: 'all' },
    { label: '참여자', value: participantKey },
    { label: '강사', value: 'instructor' },
    { label: '봉사자', value: 'volunteer' },
  ]
}

export function defaultPostWriteAudience(program?: Program): PostWriteAudienceApiKey[] {
  return buildPostWriteAudienceOptions(program).map(option => option.value)
}

/** 체크 선택값 → POST visibilityType (ALL | TEACHER,INSTRUCTOR,…) */
export function buildPostWriteVisibilityType(
  audience: PostWriteAudienceApiKey[]
): string {
  const unique = [...new Set(audience)]
  if (unique.includes('all') || unique.length === 0) {
    return 'ALL'
  }
  return unique.map(key => key.toUpperCase()).join(',')
}
