/** 게시글 공개 범위 저장 키 → 관리자 화면 표시 라벨 */
const POST_AUDIENCE_DISPLAY_LABELS: Record<string, string> = {
  all: '전체',
  teacher: '참여자',
  student: '참여자',
  participant: '참여자',
  instructor: '강사',
  volunteer: '봉사자',
}

const POST_AUDIENCE_LABEL_ORDER = [
  'all',
  'teacher',
  'student',
  'participant',
  'instructor',
  'volunteer',
] as const

function uniqueAudienceLabels(keys: string[]): string[] {
  const labels: string[] = []
  for (const key of POST_AUDIENCE_LABEL_ORDER) {
    if (!keys.includes(key)) continue
    const label = POST_AUDIENCE_DISPLAY_LABELS[key]
    if (label && !labels.includes(label)) {
      labels.push(label)
    }
  }
  return labels
}

/**
 * 관리자 게시글 상세 — 공개 범위 배지 텍스트.
 * - 단일 `all` 또는 전체에 해당 → `전체 공개`
 * - 단일 대상 → `{대상} 공개`
 * - 복수 대상 → `{대상}/{대상} 공개`
 */
export function formatProgramPostAudienceBadgeLabel(audience?: string[]): string {
  if (!audience || audience.length === 0) {
    return '전체 공개'
  }

  const keys = [...new Set(audience.map(key => key.trim()).filter(Boolean))]
  if (keys.length === 0) {
    return '전체 공개'
  }

  if (keys.length === 1 && keys[0] === 'all') {
    return '전체 공개'
  }

  const specificKeys = keys.filter(key => key !== 'all')
  const labels = uniqueAudienceLabels(specificKeys.length > 0 ? specificKeys : keys)

  if (labels.length === 0) {
    return '전체 공개'
  }

  if (labels.length === 1 && labels[0] === '전체') {
    return '전체 공개'
  }

  if (labels.length === 1) {
    return `${labels[0]} 공개`
  }

  return `${labels.join('/')} 공개`
}
