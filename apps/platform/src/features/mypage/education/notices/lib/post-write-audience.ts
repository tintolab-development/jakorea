import type { ProgramDetail } from '@/features/program'

export type PostWriteAudienceApiKey = 'all' | 'teacher' | 'student' | 'instructor' | 'volunteer'

export function resolveParticipantAudienceApiKey(
  program?: Pick<ProgramDetail, 'programAudience'>,
): 'teacher' | 'student' {
  return program?.programAudience === 'individual' ? 'student' : 'teacher'
}

export function buildPostWriteAudienceOptions(
  program?: Pick<ProgramDetail, 'programAudience'>,
): Array<{ label: string; value: PostWriteAudienceApiKey }> {
  const participantKey = resolveParticipantAudienceApiKey(program)
  return [
    { label: '전체', value: 'all' },
    { label: '참여자', value: participantKey },
    { label: '강사', value: 'instructor' },
    { label: '봉사자', value: 'volunteer' },
  ]
}

export function defaultPostWriteAudience(
  program?: Pick<ProgramDetail, 'programAudience'>,
): PostWriteAudienceApiKey[] {
  return buildPostWriteAudienceOptions(program).map(option => option.value)
}

export function buildPostWriteVisibilityType(audience: PostWriteAudienceApiKey[]): string {
  const unique = [...new Set(audience)]
  if (unique.includes('all') || unique.length === 0) {
    return 'ALL'
  }
  return unique.map(key => key.toUpperCase()).join(',')
}

export function reconcilePostWriteAudienceSelection(
  selected: PostWriteAudienceApiKey[],
  program?: Pick<ProgramDetail, 'programAudience'>,
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
