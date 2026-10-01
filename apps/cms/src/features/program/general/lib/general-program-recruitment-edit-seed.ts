/**
 * 일반 프로그램 상세 — 모집 정보 탭 수정 모드 폼 시드
 * 조회 SSOT(participantRecruitmentInfo 등)와 program 컬럼·overlay를 edit 폼에 맞춘다.
 */

import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  parseTargetLevelsFromDisplayLabel,
  resolveProgramInstructorTargets,
  resolveProgramTargetLevels,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'

export { parseTargetLevelsFromDisplayLabel }
import {
  applyGeneralRecruitOverlayToProgram,
  resolveGeneralRecruitDetailDisplayProgram,
  resolveGeneralRecruitDisplayProgram,
  type GeneralRecruitDetailAudience,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import {
  hasRecruitmentCopy,
  pickRecruitmentCopyRow,
} from '@/features/program/shared/lib/recruitment-row-copy'

function hasIsoDate(value: string | Date | undefined): boolean {
  if (value == null || value === '') return false
  return dayjs(value).isValid()
}

/** 조회용 기간 라벨 → ISO (YYYY.MM.DD · YYYY-MM-DD 등) */
export function parseDisplayPeriodLabelToIsoRange(
  label: string | undefined
): { start?: string; end?: string } {
  if (!label?.trim() || label.trim() === '-') return {}
  const parts = label
    .split(/\s*[~\-–—]\s*/)
    .map(part => part.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean)
  if (parts.length < 2) return {}
  const start = dayjs(parts[0])
  const end = dayjs(parts[1])
  if (!start.isValid() || !end.isValid()) return {}
  return {
    start: start.startOf('day').toISOString(),
    end: end.startOf('day').toISOString(),
  }
}

function parseMultiSelectFromDisplayLabel(
  label: string | undefined,
  allowed: ReadonlySet<string>
): string[] {
  if (!label?.trim() || label.trim() === '-') return []
  const parts = label
    .split(/[,，·]/)
    .map(part => part.trim())
    .filter(Boolean)
  const valid = parts.filter(part => allowed.has(part))
  return valid.length > 0 ? valid : parts
}

function parseFinalAnnouncementFromLabel(label: string | undefined): {
  date?: string
  method?: string
} {
  if (!label?.trim() || label.trim() === '-') return {}
  const [rawDate, ...methodParts] = label.split('|').map(part => part.trim())
  if (!rawDate) return {}
  const parsed = dayjs(rawDate.replace(/\([^)]*\)/g, '').trim())
  const method = methodParts.join('|').trim()
  return {
    ...(parsed.isValid() ? { date: parsed.startOf('day').toISOString() } : {}),
    ...(method ? { method } : {}),
  }
}

function coalesceIso(
  current: string | Date | undefined,
  label: string | undefined
): string | Date | undefined {
  if (hasIsoDate(current)) return current
  const range = parseDisplayPeriodLabelToIsoRange(label)
  return range.start
}

function coalesceIsoEnd(
  current: string | Date | undefined,
  label: string | undefined
): string | Date | undefined {
  if (hasIsoDate(current)) return current
  const range = parseDisplayPeriodLabelToIsoRange(label)
  return range.end
}

function enrichParticipantRecruitmentScalars(program: Program): Program {
  const info = program.generalCommonInfo?.participantRecruitmentInfo
  if (!info) return program

  let next: Program = { ...program }
  const targetLevels = resolveProgramTargetLevels(next)
  const parsed = parseTargetLevelsFromDisplayLabel(
    info.educationTarget ?? info.recruitmentTarget
  )
  if (parsed.length > targetLevels.length) {
    next = { ...next, targetLevels: parsed, targetLevel: parsed[0] }
  } else if (targetLevels.length === 0 && parsed.length > 0) {
    next = { ...next, targetLevels: parsed, targetLevel: parsed[0] }
  }

  if (!next.educationTargetDetail?.trim() && !next.district?.trim()) {
    const detail = info.educationTargetDetail ?? info.recruitmentTargetDetail
    if (detail?.trim()) {
      next = { ...next, educationTargetDetail: detail.trim(), district: detail.trim() }
    }
  }

  next = {
    ...next,
    applicationStartDate: coalesceIso(next.applicationStartDate, info.recruitmentPeriodLabel),
    applicationEndDate: coalesceIsoEnd(next.applicationEndDate, info.recruitmentPeriodLabel),
    startDate: coalesceIso(next.startDate, info.operationPeriodLabel) ?? next.startDate,
    endDate: coalesceIsoEnd(next.endDate, info.operationPeriodLabel) ?? next.endDate,
  }

  const finalParts = parseFinalAnnouncementFromLabel(
    info.finalAnnouncementLabel ?? info.resultAnnouncementLabel
  )
  if (!hasIsoDate(next.resultAnnouncementDate) && finalParts.date) {
    next = { ...next, resultAnnouncementDate: finalParts.date }
  }
  if (!next.resultAnnouncementMethod?.trim() && finalParts.method) {
    next = { ...next, resultAnnouncementMethod: finalParts.method }
  }

  return next
}

function enrichInstructorRecruitmentScalars(program: Program): Program {
  const info = program.generalCommonInfo?.instructorRecruitmentInfo
  if (!info) return program

  let next: Program = { ...program }
  if (resolveProgramInstructorTargets(next).length === 0 && info.recruitmentTarget?.trim()) {
    next = {
      ...next,
      instructorTargets: parseMultiSelectFromDisplayLabel(info.recruitmentTarget, new Set(['성인', '대학생', '기타'])),
      instructorTarget: info.recruitmentTarget.trim(),
    }
  }
  if (!next.instructorTargetDetail?.trim() && info.recruitmentTargetDetail?.trim()) {
    next = { ...next, instructorTargetDetail: info.recruitmentTargetDetail.trim() }
  }

  next = {
    ...next,
    instructorApplicationStartDate: coalesceIso(
      next.instructorApplicationStartDate,
      info.recruitmentPeriodLabel
    ),
    instructorApplicationEndDate: coalesceIsoEnd(
      next.instructorApplicationEndDate,
      info.recruitmentPeriodLabel
    ),
    startDate: coalesceIso(next.startDate, info.operationPeriodLabel) ?? next.startDate,
    endDate: coalesceIsoEnd(next.endDate, info.operationPeriodLabel) ?? next.endDate,
  }

  const finalParts = parseFinalAnnouncementFromLabel(
    info.finalAnnouncementLabel ?? info.resultAnnouncementLabel
  )
  if (!hasIsoDate(next.finalPassAnnouncementDate) && finalParts.date) {
    next = { ...next, finalPassAnnouncementDate: finalParts.date }
  }
  if (!next.finalPassAnnouncementMethod?.trim() && finalParts.method) {
    next = { ...next, finalPassAnnouncementMethod: finalParts.method }
  }

  return next
}

function enrichVolunteerRecruitmentScalars(program: Program): Program {
  const info = program.generalCommonInfo?.volunteerRecruitmentInfo
  if (!info) return program

  let next: Program = { ...program }
  if (resolveProgramVolunteerTargets(next).length === 0 && info.recruitmentTarget?.trim()) {
    next = {
      ...next,
      volunteerTargets: parseMultiSelectFromDisplayLabel(
        info.recruitmentTarget,
        new Set(['대학(원)생', '일반인', '기타'])
      ),
      volunteerTarget: info.recruitmentTarget.trim(),
    }
  }
  if (!next.volunteerTargetDetail?.trim() && info.recruitmentTargetDetail?.trim()) {
    next = { ...next, volunteerTargetDetail: info.recruitmentTargetDetail.trim() }
  }

  next = {
    ...next,
    volunteerApplicationStartDate: coalesceIso(
      next.volunteerApplicationStartDate,
      info.recruitmentPeriodLabel
    ),
    volunteerApplicationEndDate: coalesceIsoEnd(
      next.volunteerApplicationEndDate,
      info.recruitmentPeriodLabel
    ),
    startDate: coalesceIso(next.startDate, info.operationPeriodLabel) ?? next.startDate,
    endDate: coalesceIsoEnd(next.endDate, info.operationPeriodLabel) ?? next.endDate,
  }

  return next
}

/** 모집 탭 edit·저장 baseline — 저장된 overlay + in-memory overlay + nested 조회값 → program 컬럼 */
export function resolveGeneralProgramForRecruitmentEdit(program: Program): Program {
  const withPersistedOverlay = applyGeneralRecruitOverlayToProgram(
    program,
    program.registrationOverlay ?? {},
    { preferOverlay: false }
  )
  const withOverlay = resolveGeneralRecruitDisplayProgram(withPersistedOverlay, {
    preferOverlay: false,
  })
  return enrichVolunteerRecruitmentScalars(
    enrichInstructorRecruitmentScalars(enrichParticipantRecruitmentScalars(withOverlay))
  )
}

export function programToRecruitmentTabEditValues(
  program: Program,
  audience: GeneralRecruitDetailAudience
): ProgramDetailEditFormValues {
  const merged = resolveGeneralProgramForRecruitmentEdit(program)
  const base = programToDetailEditValues(merged)
  const detail = resolveGeneralRecruitDetailDisplayProgram(merged, audience)
  const recruitmentRow = pickRecruitmentCopyRow(merged, audience)
  const recruitmentCopy = recruitmentRow != null && hasRecruitmentCopy(recruitmentRow)
  const participantInfo = merged.generalCommonInfo?.participantRecruitmentInfo
  const instructorInfo = merged.generalCommonInfo?.instructorRecruitmentInfo
  const volunteerInfo = merged.generalCommonInfo?.volunteerRecruitmentInfo
  return {
    ...base,
    description: recruitmentCopy ? (detail.description ?? '') : (detail.description ?? base.description),
    recruitmentGuide: recruitmentCopy
      ? (detail.recruitmentGuide ?? '')
      : (detail.recruitmentGuide ?? base.recruitmentGuide),
    applicationMethod: recruitmentCopy
      ? (detail.applicationMethod ?? '')
      : (detail.applicationMethod ?? base.applicationMethod),
    learningSupportContent: recruitmentCopy
      ? (detail.learningSupportContent ?? '')
      : (detail.learningSupportContent ?? base.learningSupportContent),
    additionalContentHtml: recruitmentCopy
      ? (detail.additionalContentHtml ?? '')
      : (detail.additionalContentHtml ?? base.additionalContentHtml),
    otherNotes:
      audience === 'instructor'
        ? (instructorInfo?.remarks?.trim() || undefined)
        : base.otherNotes,
    remarks:
      audience === 'participant'
        ? participantInfo?.notesNotApplicable
          ? ''
          : (participantInfo?.remarks?.trim() || base.remarks)
        : base.remarks,
    oneLineIntroduction:
      audience === 'volunteer'
        ? volunteerInfo?.notesNotApplicable
          ? ''
          : (volunteerInfo?.remarks?.trim() || base.oneLineIntroduction)
        : base.oneLineIntroduction,
  }
}
