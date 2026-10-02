import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

export type RecruitmentCopyAudience = 'participant' | 'instructor' | 'volunteer'

function emptyToUndefined(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function hasRecruitmentCopy(row: ProgramRecruitmentWindow): boolean {
  return (
    row.programDescription !== undefined ||
    row.recruitmentGuide !== undefined ||
    row.applicationMethod !== undefined ||
    row.learningSupportContent !== undefined ||
    row.additionalContentHtml !== undefined ||
    row.remarks !== undefined ||
    row.otherMatters !== undefined
  )
}

/**
 * 강사·봉사자 상세 「기타사항」.
 * 행 `otherMatters` → nested `*RecruitmentInfo.otherMatters` → (레거시) 프로그램 `otherNotes`.
 * 비고(`remarks`)와 섞지 않는다. 참여자는 프로그램 기타 안내만.
 */
export function resolveRecruitmentOtherMatters(
  program: Program,
  audience: RecruitmentCopyAudience
): string | undefined {
  if (audience === 'participant') return emptyToUndefined(program.otherNotes)
  const row = pickRecruitmentCopyRow(program, audience)
  const nested =
    audience === 'instructor'
      ? program.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters
      : program.generalCommonInfo?.volunteerRecruitmentInfo?.otherMatters
  return (
    emptyToUndefined(row?.otherMatters) ||
    emptyToUndefined(nested) ||
    emptyToUndefined(program.otherNotes)
  )
}

/** 모집 비고. 강사·봉사자는 nested remarks만. 행 remarks·otherMatters와 섞지 않는다. */
export function resolveRecruitmentRemarks(
  program: Program,
  audience: RecruitmentCopyAudience
): string | undefined {
  if (audience === 'instructor') {
    return emptyToUndefined(program.generalCommonInfo?.instructorRecruitmentInfo?.remarks)
  }
  if (audience === 'volunteer') {
    return emptyToUndefined(program.generalCommonInfo?.volunteerRecruitmentInfo?.remarks)
  }
  const row = pickRecruitmentCopyRow(program, audience)
  return (
    emptyToUndefined(row?.remarks) ||
    emptyToUndefined(program.generalCommonInfo?.participantRecruitmentInfo?.remarks)
  )
}

/**
 * GET 행 기타사항만 nested에 맞춘다. 비고(remarks)는 행에서 복사하지 않는다.
 */
export function hydrateGeneralRecruitmentInfoFromRows(program: Program): Program {
  const patches: Array<{
    audience: Exclude<RecruitmentCopyAudience, 'participant'>
    key: 'instructorRecruitmentInfo' | 'volunteerRecruitmentInfo'
  }> = [
    { audience: 'instructor', key: 'instructorRecruitmentInfo' },
    { audience: 'volunteer', key: 'volunteerRecruitmentInfo' },
  ]
  let common = program.generalCommonInfo
  let changed = false
  for (const { audience, key } of patches) {
    const row = pickRecruitmentCopyRow(program, audience)
    if (!row || row.otherMatters == null) continue
    const info = { ...(common?.[key] ?? {}) }
    const next = emptyToUndefined(row.otherMatters)
    if (info.otherMatters === next) continue
    info.otherMatters = next
    common = { ...common, [key]: info }
    changed = true
  }
  return changed ? { ...program, generalCommonInfo: common } : program
}

function byStartAt(a: ProgramRecruitmentWindow, b: ProgramRecruitmentWindow): number {
  const aTime = Date.parse(a.startAt ?? '')
  const bTime = Date.parse(b.startAt ?? '')
  const aRank = Number.isNaN(aTime) ? Number.POSITIVE_INFINITY : aTime
  const bRank = Number.isNaN(bTime) ? Number.POSITIVE_INFINITY : bTime
  return aRank - bRank
}

export function pickRecruitmentCopyRow(
  program: Program,
  audience: RecruitmentCopyAudience,
  volunteerHalf?: 'h1' | 'h2'
): ProgramRecruitmentWindow | undefined {
  const rows = program.programRecruitments ?? []
  if (audience === 'volunteer' && volunteerHalf) {
    const volunteers = rows
      .filter(row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER')
      .slice()
      .sort(byStartAt)
    return volunteerHalf === 'h1' ? volunteers[0] : volunteers[1]
  }
  const type =
    audience === 'participant' ? 'PARTICIPANT' : audience === 'instructor' ? 'INSTRUCTOR' : 'VOLUNTEER'
  return rows.find(row => (row.recruitmentType ?? '').toUpperCase() === type)
}

export function writeRecruitmentRowCopy(
  program: Program,
  audience: RecruitmentCopyAudience,
  copy: Partial<
    Pick<
      ProgramRecruitmentWindow,
      | 'announcementTitle'
      | 'summary'
      | 'contactName'
      | 'contactPhone'
      | 'contactEmail'
      | 'programDescription'
      | 'recruitmentGuide'
      | 'applicationMethod'
      | 'learningSupportContent'
      | 'additionalContentHtml'
      | 'remarks'
      | 'otherMatters'
      | 'startAt'
      | 'endAt'
    >
  >,
  volunteerHalf?: 'h1' | 'h2'
): ProgramRecruitmentWindow[] | undefined {
  const rows = program.programRecruitments
  if (!rows?.length) return rows
  const target = pickRecruitmentCopyRow(program, audience, volunteerHalf)
  if (!target) return rows
  return rows.map(row => (row === target ? { ...row, ...copy } : row))
}

/** 모집 탭 문구는 recruitments[] 행만 쓴다. 없으면 프로그램 공통 문장으로 채우지 않는다. */
export function applyRecruitmentRowCopy(
  program: Program,
  audience: RecruitmentCopyAudience,
  volunteerHalf?: 'h1' | 'h2'
): Program {
  const row = pickRecruitmentCopyRow(program, audience, volunteerHalf)
  if (!row) return program
  const withRow: Program = row.id != null ? { ...program, activeRecruitmentId: row.id } : program
  if (!hasRecruitmentCopy(row)) return withRow
  const otherMatters = emptyToUndefined(row.otherMatters)
  return {
    ...withRow,
    description: emptyToUndefined(row.programDescription),
    recruitmentGuide: emptyToUndefined(row.recruitmentGuide),
    applicationMethod: emptyToUndefined(row.applicationMethod),
    learningSupportContent: emptyToUndefined(row.learningSupportContent),
    additionalContentHtml: emptyToUndefined(row.additionalContentHtml),
    ...(otherMatters ? { otherNotes: otherMatters } : {}),
    oneLineIntroduction: emptyToUndefined(row.remarks),
  }
}
