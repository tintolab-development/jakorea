/**
 * 일반 프로그램 상세 — 모집 정보 탭 수정 모드 폼 시드
 * 조회 SSOT(participantRecruitmentInfo 등)와 program 컬럼·overlay를 edit 폼에 맞춘다.
 */

import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { parseAnnouncementLabel } from '@/features/program/shared/lib/announcement-label'
import {
  parseTargetLevelsFromDisplayLabel,
  normalizeInstructorTargetList,
  resolveProgramInstructorTargets,
  resolveProgramTargetLevels,
  normalizeVolunteerTargetList,
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
  hydrateGeneralRecruitmentInfoFromRows,
  pickRecruitmentCopyRow,
  resolveRecruitmentOtherMatters,
  resolveRecruitmentRemarks,
} from '@/features/program/shared/lib/recruitment-row-copy'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  parseDisplayPeriodLabelToIsoRange,
  seedAudienceProgramOperationFormFields,
} from '@/features/program/general/lib/general-program-recruitment-operation-period'

function hasIsoDate(value: string | Date | undefined): boolean {
  if (value == null || value === '') return false
  return dayjs(value).isValid()
}

function instructorTargetsFromRecruitmentTargetLabel(label: string | undefined): string[] {
  if (!label?.trim() || label.trim() === '-') return []
  const parts = label
    .split(/[,，·]/)
    .map(part => part.trim())
    .filter(Boolean)
  return normalizeInstructorTargetList(parts)
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

  const participantRow = pickRecruitmentCopyRow(next, 'participant')
  next = {
    ...next,
    applicationStartDate: participantRow?.startAt
      ? String(participantRow.startAt)
      : coalesceIso(next.applicationStartDate, info.recruitmentPeriodLabel),
    applicationEndDate: participantRow?.endAt
      ? String(participantRow.endAt)
      : coalesceIsoEnd(next.applicationEndDate, info.recruitmentPeriodLabel),
  }

  const finalParts = parseAnnouncementLabel(
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
      instructorTargets: instructorTargetsFromRecruitmentTargetLabel(info.recruitmentTarget),
      instructorTarget: info.recruitmentTarget.trim(),
    }
  }
  if (!next.instructorTargetDetail?.trim() && info.recruitmentTargetDetail?.trim()) {
    next = { ...next, instructorTargetDetail: info.recruitmentTargetDetail.trim() }
  }

  const instructorRow = pickRecruitmentCopyRow(next, 'instructor')
  next = {
    ...next,
    instructorApplicationStartDate: instructorRow?.startAt
      ? String(instructorRow.startAt)
      : coalesceIso(next.instructorApplicationStartDate, info.recruitmentPeriodLabel),
    instructorApplicationEndDate: instructorRow?.endAt
      ? String(instructorRow.endAt)
      : coalesceIsoEnd(next.instructorApplicationEndDate, info.recruitmentPeriodLabel),
  }

  const finalParts = parseAnnouncementLabel(
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
      volunteerTargets: normalizeVolunteerTargetList(
        info.recruitmentTarget.split(/[,，·]/)
      ),
      volunteerTarget: info.recruitmentTarget.trim(),
    }
  }
  if (!next.volunteerTargetDetail?.trim() && info.recruitmentTargetDetail?.trim()) {
    next = { ...next, volunteerTargetDetail: info.recruitmentTargetDetail.trim() }
  }

  const volunteerRow = pickRecruitmentCopyRow(next, 'volunteer')
  next = {
    ...next,
    volunteerApplicationStartDate: volunteerRow?.startAt
      ? String(volunteerRow.startAt)
      : coalesceIso(next.volunteerApplicationStartDate, info.recruitmentPeriodLabel),
    volunteerApplicationEndDate: volunteerRow?.endAt
      ? String(volunteerRow.endAt)
      : coalesceIsoEnd(next.volunteerApplicationEndDate, info.recruitmentPeriodLabel),
  }

  return next
}

/** 모집 탭 edit·저장 baseline — GET 행이 기간·문의처·면접 정본. overlay는 행이 없는 키만. */
export function resolveGeneralProgramForRecruitmentEdit(
  program: Program,
  options?: { strictRemote?: boolean }
): Program {
  const fromRows = hydrateRecruitmentWindowsOntoProgram(program)
  // 교육받은 교사 원격 모드에서는 모집 row·serviceDetailJson만 SSOT로 사용한다.
  // registration.overlay는 편집기 호환 데이터이므로 모집정보를 복원하는 데 사용하지 않는다.
  const withPersistedOverlay = options?.strictRemote
    ? fromRows
    : applyGeneralRecruitOverlayToProgram(fromRows, program.registrationOverlay ?? {}, {
        preferOverlay: false,
      })
  const withOverlay = options?.strictRemote
    ? withPersistedOverlay
    : resolveGeneralRecruitDisplayProgram(withPersistedOverlay, {
        preferOverlay: false,
      })
  return hydrateRecruitmentWindowsOntoProgram(
    hydrateGeneralRecruitmentInfoFromRows(
      enrichVolunteerRecruitmentScalars(
        enrichInstructorRecruitmentScalars(enrichParticipantRecruitmentScalars(withOverlay))
      )
    )
  )
}

/** 원격 모집 화면에서 필수 row/nested 응답이 없을 때 seed 화면을 만들지 않기 위한 상태. */
export function getGeneralRecruitmentRemoteUnavailableReason(
  program: Program,
  audience: GeneralRecruitDetailAudience
): string | undefined {
  if (pickRecruitmentCopyRow(program, audience) == null) {
    return '원격 모집정보를 불러올 수 없습니다.'
  }
  const info =
    audience === 'participant'
      ? program.generalCommonInfo?.participantRecruitmentInfo
      : audience === 'instructor'
        ? program.generalCommonInfo?.instructorRecruitmentInfo
        : program.generalCommonInfo?.volunteerRecruitmentInfo
  if (info == null) return '원격 모집정보를 불러올 수 없습니다.'
  return undefined
}

export function programToRecruitmentTabEditValues(
  program: Program,
  audience: GeneralRecruitDetailAudience,
  options?: { strictRemote?: boolean }
): ProgramDetailEditFormValues {
  const merged = resolveGeneralProgramForRecruitmentEdit(program, options)
  const base = programToDetailEditValues(merged)
  const detail = resolveGeneralRecruitDetailDisplayProgram(merged, audience, {
    strictRemote: options?.strictRemote,
  })
  const recruitmentRow = pickRecruitmentCopyRow(merged, audience)
  const recruitmentCopy = recruitmentRow != null && hasRecruitmentCopy(recruitmentRow)
  const participantInfo = merged.generalCommonInfo?.participantRecruitmentInfo
  const volunteerInfo = merged.generalCommonInfo?.volunteerRecruitmentInfo as
    | {
        notesNotApplicable?: boolean
        documentPassAnnouncementDate?: string
        documentPassAnnouncementMethod?: string
        interviewStartDate?: string
        interviewEndDate?: string
        interviewMethod?: string
        finalPassAnnouncementDate?: string
        finalPassAnnouncementMethod?: string
      }
    | undefined
  return {
    ...base,
    ...seedAudienceProgramOperationFormFields(merged, audience),
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
    otherNotes: resolveRecruitmentOtherMatters(merged, audience) ?? base.otherNotes,
    instructorRecruitmentRemarks:
      audience === 'instructor'
        ? recruitmentRow?.remarksNotApplicable === true
          ? ''
          : resolveRecruitmentRemarks(merged, 'instructor')
        : undefined,
    // 강사 모집 비고 「해당 없음」 — GET 강사 모집 행 `remarksNotApplicable`이 정본(overlay·nested 미사용).
    // 행에 값이 없으면(null) 시드하지 않아 저장 payload도 바꾸지 않는다.
    instructorRecruitmentNotesNotApplicable:
      audience === 'instructor'
        ? recruitmentRow?.remarksNotApplicable === true
          ? 'not_applicable'
          : recruitmentRow?.remarksNotApplicable === false
            ? 'applicable'
            : undefined
        : undefined,
    remarks:
      audience === 'participant'
        ? participantInfo?.notesNotApplicable
          ? ''
          : (resolveRecruitmentRemarks(merged, 'participant') || base.remarks)
        : base.remarks,
    oneLineIntroduction:
      audience === 'volunteer'
        ? volunteerInfo?.notesNotApplicable
          ? ''
          : (resolveRecruitmentRemarks(merged, 'volunteer') || base.oneLineIntroduction)
        : base.oneLineIntroduction,
    // 봉사자 표시 SSOT는 nested volunteerRecruitmentInfo — 공용 컬럼(강사와 공유)보다 우선 시드
    ...(audience === 'volunteer'
      ? {
          ...(hasIsoDate(volunteerInfo?.documentPassAnnouncementDate)
            ? {
                documentPassAnnouncementDate: String(volunteerInfo!.documentPassAnnouncementDate),
              }
            : {}),
          ...(volunteerInfo?.documentPassAnnouncementMethod?.trim()
            ? {
                documentPassAnnouncementMethod:
                  volunteerInfo.documentPassAnnouncementMethod.trim(),
              }
            : {}),
          ...(hasIsoDate(volunteerInfo?.interviewStartDate)
            ? { interviewStartDate: String(volunteerInfo!.interviewStartDate) }
            : {}),
          ...(hasIsoDate(volunteerInfo?.interviewEndDate)
            ? { interviewEndDate: String(volunteerInfo!.interviewEndDate) }
            : {}),
          ...(volunteerInfo?.interviewMethod?.trim()
            ? { interviewMethod: volunteerInfo.interviewMethod.trim() }
            : {}),
          ...(hasIsoDate(volunteerInfo?.finalPassAnnouncementDate)
            ? {
                finalPassAnnouncementDate: String(volunteerInfo!.finalPassAnnouncementDate),
              }
            : {}),
          ...(volunteerInfo?.finalPassAnnouncementMethod?.trim()
            ? {
                finalPassAnnouncementMethod: volunteerInfo.finalPassAnnouncementMethod.trim(),
              }
            : {}),
        }
      : {}),
    ...(isGeneralRowCopyProgram(merged)
      ? generalRecruitmentRowFormSeed(recruitmentRow, audience)
      : {}),
    ...(isTrainedTeachersDetailProgram(merged) && audience === 'participant'
      ? trainedTeachersParticipantRecruitmentRowFormSeed(recruitmentRow)
      : {}),
  }
}

function isGeneralRowCopyProgram(program: Program): boolean {
  const type = program.backendProgramType?.toUpperCase() ?? ''
  return type === 'GENERAL' || type.startsWith('GENERAL_')
}

/** TT 참여자 모집 — GET 행만. null 도 컬럼·nested 시드를 덮어 빈 칸으로 둔다. */
function trainedTeachersParticipantRecruitmentRowFormSeed(
  row: ReturnType<typeof pickRecruitmentCopyRow>
): Partial<ProgramDetailEditFormValues> {
  if (!row) return {}
  return {
    ...(row.startAt ? { applicationStartDate: String(row.startAt) } : {}),
    ...(row.endAt ? { applicationEndDate: String(row.endAt) } : {}),
    ...(row.operationStartDate
      ? { participantProgramOperationStartDate: String(row.operationStartDate) }
      : {}),
    ...(row.operationEndDate
      ? { participantProgramOperationEndDate: String(row.operationEndDate) }
      : {}),
    recruitmentContactOrganizationName: row.contactName?.trim() ?? '',
    contactPhone: row.contactPhone?.trim() ?? '',
    contactEmail: row.contactEmail?.trim() ?? '',
    remarks: row.remarks?.trim() ?? '',
  }
}

/** 일반 프로그램 모집 탭은 그 행의 문의처만 보여 준다. 공고명은 공통정보를 본다. */
function generalRecruitmentRowFormSeed(
  row: ReturnType<typeof pickRecruitmentCopyRow>,
  audience: GeneralRecruitDetailAudience
): Partial<ProgramDetailEditFormValues> {
  if (!row) return {}
  const dates =
    audience === 'instructor'
      ? {
          ...(row.startAt ? { instructorApplicationStartDate: String(row.startAt) } : {}),
          ...(row.endAt ? { instructorApplicationEndDate: String(row.endAt) } : {}),
          ...(row.operationStartDate
            ? { instructorProgramOperationStartDate: String(row.operationStartDate) }
            : {}),
          ...(row.operationEndDate
            ? { instructorProgramOperationEndDate: String(row.operationEndDate) }
            : {}),
        }
      : audience === 'volunteer'
        ? {
            ...(row.startAt ? { volunteerApplicationStartDate: String(row.startAt) } : {}),
            ...(row.endAt ? { volunteerApplicationEndDate: String(row.endAt) } : {}),
            ...(row.operationStartDate
              ? { volunteerProgramOperationStartDate: String(row.operationStartDate) }
              : {}),
            ...(row.operationEndDate
              ? { volunteerProgramOperationEndDate: String(row.operationEndDate) }
              : {}),
            ...(row.interviewStartAt ? { interviewStartDate: String(row.interviewStartAt) } : {}),
            ...(row.interviewEndAt ? { interviewEndDate: String(row.interviewEndAt) } : {}),
          }
        : {
            ...(row.startAt ? { applicationStartDate: String(row.startAt) } : {}),
            ...(row.endAt ? { applicationEndDate: String(row.endAt) } : {}),
            ...(row.operationStartDate
              ? { participantProgramOperationStartDate: String(row.operationStartDate) }
              : {}),
            ...(row.operationEndDate
              ? { participantProgramOperationEndDate: String(row.operationEndDate) }
              : {}),
            ...((row.applicationType ?? '').toUpperCase() === 'INDIVIDUAL' && row.interviewStartAt
              ? { interviewStartDate: String(row.interviewStartAt) }
              : {}),
            ...((row.applicationType ?? '').toUpperCase() === 'INDIVIDUAL' && row.interviewEndAt
              ? { interviewEndDate: String(row.interviewEndAt) }
              : {}),
          }
  const contact =
    audience === 'instructor'
      ? {
          ...(row.contactName != null
            ? { instructorRecruitmentContactOrganizationName: row.contactName }
            : {}),
          ...(row.contactPhone != null ? { instructorContactPhone: row.contactPhone } : {}),
          ...(row.contactEmail != null ? { instructorContactEmail: row.contactEmail } : {}),
        }
      : audience === 'volunteer'
        ? {
            ...(row.contactName != null
              ? { volunteerRecruitmentContactOrganizationName: row.contactName }
              : {}),
            ...(row.contactPhone != null ? { volunteerContactPhone: row.contactPhone } : {}),
            ...(row.contactEmail != null ? { volunteerContactEmail: row.contactEmail } : {}),
          }
        : {
            ...(row.contactName != null
              ? { recruitmentContactOrganizationName: row.contactName }
              : {}),
            ...(row.contactPhone != null ? { contactPhone: row.contactPhone } : {}),
            ...(row.contactEmail != null ? { contactEmail: row.contactEmail } : {}),
          }
  return { ...dates, ...contact }
}
