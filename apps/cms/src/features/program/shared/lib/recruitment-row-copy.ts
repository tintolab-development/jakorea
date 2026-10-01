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
    row.remarks !== undefined
  )
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
  return {
    ...withRow,
    description: emptyToUndefined(row.programDescription),
    recruitmentGuide: emptyToUndefined(row.recruitmentGuide),
    applicationMethod: emptyToUndefined(row.applicationMethod),
    learningSupportContent: emptyToUndefined(row.learningSupportContent),
    additionalContentHtml: emptyToUndefined(row.additionalContentHtml),
    otherNotes: emptyToUndefined(row.remarks),
    oneLineIntroduction: emptyToUndefined(row.remarks),
  }
}
