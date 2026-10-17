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

/** API·도메인 audience 배열 → 수정 폼 체크박스 값 (전체=ALL 이면 모든 항목 체크) */
export function postWriteAudienceFromStored(
  stored: string[] | undefined,
  program?: Program
): PostWriteAudienceApiKey[] {
  const defaults = defaultPostWriteAudience(program)
  if (!stored?.length) return defaults

  const participantKey = resolveParticipantAudienceApiKey(program)
  const mapped = stored
    .map(key => {
      const lower = key.trim().toLowerCase()
      if (lower === 'all') return 'all' as const
      if (lower === 'participant' || lower === 'teacher' || lower === 'student') {
        return participantKey
      }
      if (lower === 'instructor') return 'instructor' as const
      if (lower === 'volunteer') return 'volunteer' as const
      return null
    })
    .filter((key): key is PostWriteAudienceApiKey => key != null)

  const unique = [...new Set(mapped)]
  if (unique.length === 0) return defaults

  return reconcilePostWriteAudienceSelection(unique, program)
}

/** 체크박스 onChange — 「전체」 선택 시 나머지 항목도 함께 체크 */
export function reconcilePostWriteAudienceSelection(
  selected: PostWriteAudienceApiKey[],
  program?: Program
): PostWriteAudienceApiKey[] {
  const allKeys = defaultPostWriteAudience(program)
  const unique = [...new Set(selected)]

  if (unique.includes('all')) {
    const everyOptionChecked = allKeys.every(key => unique.includes(key))
    if (everyOptionChecked || unique.length === 1) {
      return allKeys
    }
    return unique.filter(key => key !== 'all')
  }

  const withoutAll = allKeys.filter(key => key !== 'all')
  if (withoutAll.every(key => unique.includes(key))) {
    return allKeys
  }

  return unique
}
