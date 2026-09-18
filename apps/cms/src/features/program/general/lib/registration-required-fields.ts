import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

export type GeneralProgramRegistrationRequiredFieldContext = {
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  scheduleCurriculumPreEducation: boolean
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  sponsorId: string
  sponsorContactId: string
  programTitleKo: string
}

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function readOverlay(overlay: Record<string, unknown>, key: string): unknown {
  return overlay[key]
}

function isIpsIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return true
  const row = value as { category?: unknown }
  // 2차(detail) 미선택·none은 create 요약「해당 없음」과 동일 — 1차 IPS 유형만 필수
  return isEmptyText(row.category)
}

function isRecord(value: unknown): value is Record<number, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function readIndexRecord(overlay: Record<string, unknown>, key: string): Record<number, unknown> {
  const raw = overlay[key]
  return isRecord(raw) ? raw : {}
}

function hasAudience(participant: ProgramRegistrationParticipantSelection): boolean {
  return (
    participant.individual ||
    participant.organization ||
    participant.teacherInstructor ||
    participant.volunteer
  )
}

function isAssignmentIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return false
  const row = value as { enabled?: unknown; period?: unknown }
  if (row.enabled !== true) return false
  return isEmptyText(row.period)
}

function isGroupTimeIncomplete(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.some(slot => {
    if (slot == null || typeof slot !== 'object') return true
    const row = slot as { startTime?: unknown; endTime?: unknown }
    return isEmptyText(row.startTime) || isEmptyText(row.endTime)
  })
}

function hideEducationScheduleSettings(
  programType: ProgramRegistrationType,
  sessionRoundType: ProgramRegistrationSessionRoundType
): boolean {
  return programType === 'schedule' && sessionRoundType === 'multi'
}

function hasIncompleteBasicInfo(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (isEmptyText(ctx.programTitleKo)) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.programTitleEn'))) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.publicProgramTitle'))) {
    return true
  }
  // 일정형: 세부 프로그램명「해당없음」고정 — 선택 검증 생략(실적에서는 일정명 반영)
  if (ctx.programType !== 'schedule') {
    const detailedId = readOverlay(overlay, 'generalRegistration.basicInfo.detailedProgramId')
    const detailedName = readOverlay(overlay, 'generalRegistration.basicInfo.detailedProgramName')
    const hasDetailedId =
      (typeof detailedId === 'number' && Number.isFinite(detailedId) && detailedId > 0) ||
      (typeof detailedId === 'string' && detailedId.trim() !== '')
    const hasDetailedName = typeof detailedName === 'string' && detailedName.trim() !== ''
    if (!hasDetailedId && !hasDetailedName) return true
  }
  const operationRange = readOverlay(overlay, 'generalRegistration.basicInfo.operationRangeSeal')
  if (operationRange == null || typeof operationRange !== 'object') return true
  const range = operationRange as { start?: unknown; end?: unknown }
  if (isEmptyText(range.start) || isEmptyText(range.end)) return true
  if (!hasAudience(ctx.participant)) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.businessField'))) return true
  if (isEmptyText(ctx.sponsorId)) return true
  if (isEmptyText(ctx.sponsorContactId)) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationVenueDetail'))) {
    return true
  }
  // 설문 진행 항목 — 0개 선택도 완료 (선택)
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationCourse'))) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.ipOwned'))) return true
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.courseDeliveredBy'))) {
    return true
  }
  return false
}

function hasIncompleteKpi(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.participantCount'))) return true
  if (
    ctx.participant.teacherInstructor &&
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.instructor'))
  ) {
    return true
  }
  if (
    ctx.participant.volunteer &&
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.volunteer'))
  ) {
    return true
  }
  if (!ctx.participant.individual) {
    if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.dispatchedSchool'))) return true
    if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.dispatchedClass'))) return true
  }
  return false
}

function hasIncompleteWage(overlay: Record<string, unknown>): boolean {
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade1Fee'))) return true
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade2Fee'))) return true
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade3Fee'))) return true
  const paymentItems = readOverlay(overlay, 'generalRegistration.wageInfo.paymentItemValues')
  if (!Array.isArray(paymentItems) || paymentItems.length === 0) return true
  return false
}

function hasIncompleteTypeSettings(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  const showParticipation = !ctx.participant.organization
  if (ctx.sessionRoundType === 'multi') {
    if (
      ctx.educationFormScheduleDetail === 'common' &&
      isEmptyText(readOverlay(overlay, 'generalRegistration.typeSettings.multiCommonEducationForm'))
    ) {
      return true
    }
    if (
      showParticipation &&
      ctx.participationScheduleDetail === 'common' &&
      isEmptyText(readOverlay(overlay, 'generalRegistration.typeSettings.multiCommonParticipation'))
    ) {
      return true
    }
  }
  if (ctx.ipsScheduleDetail === 'common') {
    return isIpsIncomplete(readOverlay(overlay, 'generalRegistration.typeSettings.ipsType'))
  }
  return false
}

function hasIncompleteCurriculum(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (ctx.programType !== 'curriculum') return false
  const chartCount = Math.max(1, ctx.curriculumChartSessionCount)
  const unitNames = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.unitNameBySession'
  )
  const unitContents = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.unitContentBySession'
  )
  const ipsBySession = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.ipsBySession'
  )
  if (ctx.sessionRoundType === 'single') {
    for (let index = 1; index <= chartCount; index += 1) {
      if (isEmptyText(unitNames[index])) return true
      if (isEmptyText(unitContents[index])) return true
      if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index])) {
        return true
      }
    }
    return false
  }

  const roundCount = Math.max(1, ctx.curriculumSessionCount)
  const progressByRound = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.progressSessionByRound'
  )
  const roundContents = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.roundContentByRound'
  )
  const participationBySession = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.participationBySession'
  )
  const assignmentByRound = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.assignmentByRound'
  )
  for (let index = 1; index <= roundCount; index += 1) {
    if (isEmptyText(progressByRound[index])) return true
    if (isEmptyText(roundContents[index])) return true
    if (
      !ctx.participant.organization &&
      ctx.participationScheduleDetail === 'perSchedule' &&
      isEmptyText(participationBySession[index])
    ) {
      return true
    }
    if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index])) {
      return true
    }
    // 학교/기관 대상은 과제 UI 비노출 — 잔존 overlay로 미완료 처리하지 않음 (일정형과 동일)
    if (!ctx.participant.organization && isAssignmentIncomplete(assignmentByRound[index])) {
      return true
    }
  }
  if (ctx.scheduleCurriculumPreEducation) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationCurriculum.preEducationScheduleName'
    )
    if (preEducationName !== undefined && isEmptyText(preEducationName)) return true
    if (
      isEmptyText(readOverlay(overlay, 'generalRegistration.educationCurriculum.preEducationScheduleLine'))
    ) {
      return true
    }
  }
  return false
}

function hasIncompleteScheduleCurriculum(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (ctx.programType !== 'schedule') return false
  const detailCount = Math.max(1, ctx.scheduleCurriculumDetailCount)
  const eventNames = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.eventNameByDetail'
  )
  const scheduleDates = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso'
  )
  const groupTimes = readIndexRecord(overlay, GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY)
  const ipsByDetail = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex'
  )
  const educationFormByDetail = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.educationFormByDetail'
  )
  const participationByDetail = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.participationByDetail'
  )
  const assignmentByDetail = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.assignmentByDetail'
  )
  const groupCount =
    ctx.sessionRoundType === 'multi' ? 1 : Math.max(1, ctx.scheduleCurriculumGroupCount)

  for (let index = 1; index <= detailCount; index += 1) {
    if (isEmptyText(eventNames[index])) return true
    if (ctx.sessionRoundType === 'multi' && ctx.educationFormScheduleDetail === 'perSchedule') {
      if (isEmptyText(scheduleDates[index])) return true
    } else {
      const slots = groupTimes[index]
      if (!Array.isArray(slots) || slots.length < groupCount) return true
      if (isGroupTimeIncomplete(slots.slice(0, groupCount))) return true
    }
    if (
      ctx.educationFormScheduleDetail === 'perSchedule' &&
      isEmptyText(educationFormByDetail[index])
    ) {
      return true
    }
    if (
      !ctx.participant.organization &&
      ctx.participationScheduleDetail === 'perSchedule' &&
      isEmptyText(participationByDetail[index])
    ) {
      return true
    }
    if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsByDetail[index])) {
      return true
    }
    if (!ctx.participant.organization && isAssignmentIncomplete(assignmentByDetail[index])) {
      return true
    }
  }
  if (ctx.scheduleCurriculumPreEducation) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationScheduleCurriculum.preEducationName'
    )
    if (preEducationName !== undefined && isEmptyText(preEducationName)) return true
  }
  return false
}

function hasIncompleteEducationScheduleSettings(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (hideEducationScheduleSettings(ctx.programType, ctx.sessionRoundType)) return false
  const lines = readOverlay(overlay, GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY)
  if (Array.isArray(lines) && lines.some(line => typeof line === 'string' && line.trim())) {
    return false
  }
  if (ctx.educationScheduleMode === 'period') {
    return isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.periodDateIso'))
  }
  return isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.singleDateIso'))
}

/** 일반 프로그램 등록 1단계(공통 정보) — 필수 필드 미입력 여부 */
export function hasIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (hasIncompleteBasicInfo(overlay, ctx)) return true
  if (hasIncompleteKpi(overlay, ctx)) return true
  if (hasIncompleteWage(overlay)) return true
  if (hasIncompleteTypeSettings(overlay, ctx)) return true
  if (hasIncompleteCurriculum(overlay, ctx)) return true
  if (hasIncompleteScheduleCurriculum(overlay, ctx)) return true
  if (hasIncompleteEducationScheduleSettings(overlay, ctx)) return true
  return false
}
