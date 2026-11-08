import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import type { ProgramRecruitmentWindow } from '@/types/domain'

export type RecruitmentApplicationType = 'INDIVIDUAL' | 'ORGANIZATION' | 'INSTRUCTOR' | 'VOLUNTEER'

const ROW_COPY_KEYS = [
  'announcementTitle',
  'summary',
  'programDescription',
  'recruitmentGuide',
  'applicationMethod',
  'learningSupportContent',
  'additionalContentHtml',
  'remarks',
  'otherMatters',
  'contactName',
  'contactPhone',
  'contactEmail',
  'startAt',
  'endAt',
  'operationStartDate',
  'operationEndDate',
  'interviewEnabled',
  'interviewStartAt',
  'interviewEndAt',
] as const satisfies ReadonlyArray<keyof ProgramRecruitmentWindow>

/** 생성된 요청 타입에 아직 없는 행 필드. */
type RecruitmentRowRequest = ProgramRecruitmentRequest & {
  otherMatters?: string | null
}

export function resolveRecruitmentApplicationType(
  recruitmentType: string | null | undefined,
  targetType: string | null | undefined
): RecruitmentApplicationType | undefined {
  const type = (recruitmentType ?? '').toUpperCase()
  if (type === 'INSTRUCTOR') return 'INSTRUCTOR'
  if (type === 'VOLUNTEER') return 'VOLUNTEER'
  if (type === 'PARTICIPANT') {
    const target = (targetType ?? '').toUpperCase()
    if (target === 'ORGANIZATION' || target === 'INDIVIDUAL') return target
  }
  return undefined
}

function rowApplicationType(
  row: ProgramRecruitmentWindow
): RecruitmentApplicationType | undefined {
  const raw = row.applicationType?.toUpperCase()
  if (raw === 'INDIVIDUAL' || raw === 'ORGANIZATION' || raw === 'INSTRUCTOR' || raw === 'VOLUNTEER') {
    return raw
  }
  return resolveRecruitmentApplicationType(row.recruitmentType, row.targetType)
}

function byStartAt(a: ProgramRecruitmentWindow, b: ProgramRecruitmentWindow): number {
  const aTime = Date.parse(a.startAt ?? '')
  const bTime = Date.parse(b.startAt ?? '')
  return (Number.isNaN(aTime) ? Infinity : aTime) - (Number.isNaN(bTime) ? Infinity : bTime)
}

/**
 * 저장 요청 행에 기존 행은 `id`, 새 행은 `applicationType`을 붙인다.
 * 같은 유형 행이 여럿이면 모집 시작일이 빠른 행부터 차례로 맞춘다.
 * 요청에 recruitTerm이 있으면 같은 recruitTerm 행만 고른다. UJAT 반기를 startAt으로 추측하지 않는다.
 * BE는 id·applicationType이 하나라도 있으면 보내지 않은 행을 그대로 둔다.
 */
export function attachRecruitmentRowIdentity(
  rows: ProgramRecruitmentRequest[],
  existing: ProgramRecruitmentWindow[] | undefined
): ProgramRecruitmentRequest[] {
  const candidates = (existing ?? []).filter(row => row.id != null).slice().sort(byStartAt)
  const claimed = new Set<number>()
  return rows.map(row => {
    if (row.id != null) {
      claimed.add(row.id)
      return row
    }
    const applicationType =
      row.applicationType ?? resolveRecruitmentApplicationType(row.recruitmentType, row.targetType)
    const match = candidates.find(
      candidate =>
        !claimed.has(candidate.id!) &&
        (candidate.recruitmentType ?? '').toUpperCase() ===
          (row.recruitmentType ?? '').toUpperCase() &&
        rowApplicationType(candidate) === applicationType &&
        (row.recruitTerm == null || candidate.recruitTerm === row.recruitTerm)
    )
    if (match) {
      claimed.add(match.id!)
      return { ...row, id: match.id, applicationType: applicationType ?? null }
    }
    return { ...row, applicationType: applicationType ?? null }
  })
}

/** 화면에서 바뀐 모집 행 문구만 행 id로 보낸다. 빈 값은 `""`(비움)로 보낸다. */
export function buildRecruitmentRowCopyRequests(
  next: ProgramRecruitmentWindow[] | undefined,
  existing: ProgramRecruitmentWindow[] | undefined,
  isLocked: (row: ProgramRecruitmentWindow) => boolean = () => false
): RecruitmentRowRequest[] {
  if (!next?.length) return []
  const before = new Map((existing ?? []).filter(row => row.id != null).map(row => [row.id!, row]))
  const out: RecruitmentRowRequest[] = []
  for (const row of next) {
    if (row.id == null || isLocked(row)) continue
    const prev = before.get(row.id)
    const changed: Partial<RecruitmentRowRequest> = {}
    for (const key of ROW_COPY_KEYS) {
      if (!(key in row)) continue
      if (key === 'interviewEnabled') {
        const value = row.interviewEnabled ?? null
        const prevValue = prev?.interviewEnabled ?? null
        if (value !== prevValue) changed.interviewEnabled = value
        continue
      }
      const value = row[key] ?? ''
      const prevValue = prev?.[key] ?? ''
      if (value !== prevValue) {
        ;(changed as Record<string, string | boolean | null>)[key] = value
      }
    }
    if (Object.keys(changed).length === 0) continue
    out.push({
      id: row.id,
      recruitmentType: row.recruitmentType as ProgramRecruitmentRequest['recruitmentType'],
      applicationType: rowApplicationType(row) ?? null,
      ...changed,
    })
  }
  return out
}

/** 저장된 모집행은 id와 구조 필드만 남긴다. 일반 정보 값으로 덮지 않는다. */
export function recruitmentRowIdentityRequests(
  rows: ProgramRecruitmentWindow[] | undefined
): ProgramRecruitmentRequest[] {
  const out: ProgramRecruitmentRequest[] = []
  for (const row of rows ?? []) {
    if (row.id == null) continue
    const recruitmentType = (row.recruitmentType ?? '').toUpperCase()
    if (
      recruitmentType !== 'PARTICIPANT' &&
      recruitmentType !== 'INSTRUCTOR' &&
      recruitmentType !== 'VOLUNTEER'
    ) {
      continue
    }
    const applicationType = rowApplicationType(row)
    out.push({
      id: row.id,
      recruitmentType: recruitmentType as ProgramRecruitmentRequest['recruitmentType'],
      ...(applicationType ? { applicationType } : {}),
      ...(row.targetType ? { targetType: row.targetType } : {}),
      ...(row.recruitTerm === 'FIRST_HALF' || row.recruitTerm === 'SECOND_HALF'
        ? { recruitTerm: row.recruitTerm }
        : {}),
    })
  }
  return out
}

/** 같은 행 id 요청은 하나로 합친다. */
export function mergeRecruitmentRowRequests(
  ...groups: ProgramRecruitmentRequest[][]
): ProgramRecruitmentRequest[] {
  const out: ProgramRecruitmentRequest[] = []
  for (const row of groups.flat()) {
    const same = row.id != null ? out.findIndex(item => item.id === row.id) : -1
    if (same >= 0) out[same] = { ...out[same], ...row }
    else out.push(row)
  }
  return out
}
