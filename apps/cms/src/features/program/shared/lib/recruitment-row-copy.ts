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
    const volunteers = rows.filter(
      row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER'
    )
    if (volunteers.some(row => row.recruitTerm != null)) {
      const term = volunteerHalf === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
      return volunteers.find(row => row.recruitTerm === term)
    }
    const ordered = volunteers.slice().sort(byStartAt)
    return volunteerHalf === 'h1' ? ordered[0] : ordered[1]
  }
  const type =
    audience === 'participant' ? 'PARTICIPANT' : audience === 'instructor' ? 'INSTRUCTOR' : 'VOLUNTEER'
  const byRecruitmentType = rows.find(
    row => (row.recruitmentType ?? '').toUpperCase() === type
  )
  if (byRecruitmentType) return byRecruitmentType
  if (audience === 'volunteer') {
    return rows.find(row => (row.applicationType ?? '').toUpperCase() === 'VOLUNTEER')
  }
  if (audience === 'instructor') {
    return rows.find(row => (row.applicationType ?? '').toUpperCase() === 'INSTRUCTOR')
  }
  return rows.find(row => {
    const applicationType = (row.applicationType ?? '').toUpperCase()
    return applicationType === 'ORGANIZATION' || applicationType === 'INDIVIDUAL'
  })
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
      | 'interviewEnabled'
      | 'interviewStartAt'
      | 'interviewEndAt'
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

/** 모집 탭 문구는 recruitments[] 행의 실제 값이 있으면 그 행을 쓴다. 빈 칸은 overlay 값을 지우지 않는다. */
export function applyRecruitmentRowCopy(
  program: Program,
  audience: RecruitmentCopyAudience,
  volunteerHalf?: 'h1' | 'h2'
): Program {
  const row = pickRecruitmentCopyRow(program, audience, volunteerHalf)
  if (!row) return program
  const withRow: Program = row.id != null ? { ...program, activeRecruitmentId: row.id } : program
  const description = emptyToUndefined(row.programDescription)
  const recruitmentGuide = emptyToUndefined(row.recruitmentGuide)
  const applicationMethod = emptyToUndefined(row.applicationMethod)
  const learningSupportContent = emptyToUndefined(row.learningSupportContent)
  const additionalContentHtml = emptyToUndefined(row.additionalContentHtml)
  const otherMatters = emptyToUndefined(row.otherMatters)
  const remarks = emptyToUndefined(row.remarks)
  if (
    !description &&
    !recruitmentGuide &&
    !applicationMethod &&
    !learningSupportContent &&
    !additionalContentHtml &&
    !otherMatters &&
    !remarks
  ) {
    return withRow
  }
  return {
    ...withRow,
    ...(description ? { description } : {}),
    ...(recruitmentGuide ? { recruitmentGuide } : {}),
    ...(applicationMethod ? { applicationMethod } : {}),
    ...(learningSupportContent ? { learningSupportContent } : {}),
    ...(additionalContentHtml ? { additionalContentHtml } : {}),
    ...(otherMatters ? { otherNotes: otherMatters } : {}),
    ...(remarks ? { oneLineIntroduction: remarks } : {}),
  }
}
