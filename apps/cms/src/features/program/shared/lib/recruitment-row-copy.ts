import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

export type RecruitmentCopyAudience = 'participant' | 'instructor' | 'volunteer'

function emptyToUndefined(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function hasOwnField(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

/**
 * 모집 row가 필드를 내려줬으면 빈 문자열도 정본이다.
 * undefined만 구형/부분 응답에서 필드가 없는 것으로 취급한다.
 */
function rowText(
  row: ProgramRecruitmentWindow,
  key:
    | 'programDescription'
    | 'recruitmentGuide'
    | 'applicationMethod'
    | 'learningSupportContent'
    | 'additionalContentHtml'
    | 'remarks'
    | 'otherMatters'
): string | undefined {
  if (!hasOwnField(row, key) || row[key] === undefined) return undefined
  return row[key] ?? ''
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
  if (row && hasOwnField(row, 'otherMatters') && row.otherMatters !== undefined) {
    return emptyToUndefined(row.otherMatters)
  }
  const nested =
    audience === 'instructor'
      ? program.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters
      : program.generalCommonInfo?.volunteerRecruitmentInfo?.otherMatters
  return emptyToUndefined(nested) || emptyToUndefined(program.otherNotes)
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
  if (row && hasOwnField(row, 'remarks') && row.remarks !== undefined) {
    return emptyToUndefined(row.remarks)
  }
  return emptyToUndefined(program.generalCommonInfo?.participantRecruitmentInfo?.remarks)
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
    if (!row || !hasOwnField(row, 'otherMatters') || row.otherMatters === undefined) continue
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
    const volunteers = rows.filter(row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER')
    if (volunteers.some(row => row.recruitTerm != null)) {
      const term = volunteerHalf === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
      return volunteers.find(row => row.recruitTerm === term)
    }
    const ordered = volunteers.slice().sort(byStartAt)
    return volunteerHalf === 'h1' ? ordered[0] : ordered[1]
  }
  const type =
    audience === 'participant'
      ? 'PARTICIPANT'
      : audience === 'instructor'
        ? 'INSTRUCTOR'
        : 'VOLUNTEER'
  if (program.activeRecruitmentId != null) {
    const active = rows.find(row => row.id === program.activeRecruitmentId)
    if (active && (active.recruitmentType ?? '').toUpperCase() === type) return active
  }
  const byRecruitmentType = rows.find(row => (row.recruitmentType ?? '').toUpperCase() === type)
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

/** 모집 탭 문구는 recruitments[] 행의 실제 값이 있으면 그 행을 쓴다. 빈 칸은 overlay로 대체하지 않는다. */
export function applyRecruitmentRowCopy(
  program: Program,
  audience: RecruitmentCopyAudience,
  volunteerHalf?: 'h1' | 'h2'
): Program {
  const row = pickRecruitmentCopyRow(program, audience, volunteerHalf)
  if (!row) return program
  const withRow: Program = row.id != null ? { ...program, activeRecruitmentId: row.id } : program
  const description = rowText(row, 'programDescription')
  const recruitmentGuide = rowText(row, 'recruitmentGuide')
  const applicationMethod = rowText(row, 'applicationMethod')
  const learningSupportContent = rowText(row, 'learningSupportContent')
  const additionalContentHtml = rowText(row, 'additionalContentHtml')
  const otherMatters = rowText(row, 'otherMatters')
  const remarks = rowText(row, 'remarks')
  if (
    description === undefined &&
    recruitmentGuide === undefined &&
    applicationMethod === undefined &&
    learningSupportContent === undefined &&
    additionalContentHtml === undefined &&
    otherMatters === undefined &&
    remarks === undefined
  ) {
    return withRow
  }
  return {
    ...withRow,
    ...(description !== undefined ? { description } : {}),
    ...(recruitmentGuide !== undefined ? { recruitmentGuide } : {}),
    ...(applicationMethod !== undefined ? { applicationMethod } : {}),
    ...(learningSupportContent !== undefined ? { learningSupportContent } : {}),
    ...(additionalContentHtml !== undefined ? { additionalContentHtml } : {}),
    ...(otherMatters !== undefined ? { otherNotes: otherMatters } : {}),
    ...(remarks !== undefined ? { oneLineIntroduction: remarks } : {}),
  }
}
