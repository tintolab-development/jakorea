/**
 * 일반 프로그램 등록 1단계 필수 검사.
 *
 * 정책: UI가 보여주는 기본값(`online` / `individual` / 「사전 교육」 등)이 overlay에
 * 아직 안 적혀 있어도 미입력으로 보지 않는다. create 매핑과 같은 resolver를 쓴다.
 * IPS 1차·직접 입력 텍스트·금액처럼 기본값이 없는 항목만 비어 있으면 막는다.
 *
 * 1사1교는 `economy-program-registration-required-fields`가 같은 정책(readText fallback).
 * 교육받은 교사는 KPI·임금 단락이 없어 이 함수로 검사하지 않는다.
 * UJAT 등록 위저드는 `ujat-program-registration-required-fields`를 사용한다.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  resolveGeneralRegistrationCommonEducationForm,
  resolveGeneralRegistrationCommonParticipation,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
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

/** 어느 필수 항목이 비어 있는지 진단용 reason 문자열 (null = 완료) */
function findIncompleteBasicInfoReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  if (isEmptyText(ctx.programTitleKo)) return 'basicInfo.programTitleKo'
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.programTitleEn'))) {
    return 'basicInfo.programTitleEn'
  }
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.publicProgramTitle'))) {
    return 'basicInfo.publicProgramTitle'
  }
  // 일정형: 세부 프로그램명「해당없음」고정 — 선택 검증 생략(실적에서는 일정명 반영)
  if (ctx.programType !== 'schedule') {
    const detailedId = readOverlay(overlay, 'generalRegistration.basicInfo.detailedProgramId')
    const detailedName = readOverlay(overlay, 'generalRegistration.basicInfo.detailedProgramName')
    const hasDetailedId =
      (typeof detailedId === 'number' && Number.isFinite(detailedId) && detailedId > 0) ||
      (typeof detailedId === 'string' && detailedId.trim() !== '')
    const hasDetailedName = typeof detailedName === 'string' && detailedName.trim() !== ''
    if (!hasDetailedId && !hasDetailedName) return 'basicInfo.detailedProgram'
  }
  const operationRange = readOverlay(overlay, 'generalRegistration.basicInfo.operationRangeSeal')
  if (operationRange == null || typeof operationRange !== 'object') {
    return 'basicInfo.operationRangeSeal'
  }
  const range = operationRange as { start?: unknown; end?: unknown }
  if (isEmptyText(range.start) || isEmptyText(range.end)) return 'basicInfo.operationRangeSeal'
  if (!hasAudience(ctx.participant)) return 'basicInfo.audience'
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.businessField'))) {
    return 'basicInfo.businessField'
  }
  if (isEmptyText(ctx.sponsorId)) return 'basicInfo.sponsorId'
  if (isEmptyText(ctx.sponsorContactId)) return 'basicInfo.sponsorContactId'
  // 교육 장소 상세 텍스트 — 「기타(직접입력)」선택 시에만 필수
  const venueKind = readOverlay(overlay, 'generalRegistration.basicInfo.educationVenueKind')
  if (
    venueKind === 'other' &&
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationVenueDetail'))
  ) {
    return 'basicInfo.educationVenueDetail'
  }
  // 설문 진행 항목 — 0개 선택도 완료 (선택)
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationCourse'))) {
    return 'basicInfo.educationCourse'
  }
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.ipOwned'))) {
    return 'basicInfo.ipOwned'
  }
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.courseDeliveredBy'))) {
    return 'basicInfo.courseDeliveredBy'
  }
  return null
}

function findIncompleteKpiReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.participantCount'))) {
    return 'kpi.participantCount'
  }
  if (
    ctx.participant.teacherInstructor &&
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.instructor'))
  ) {
    return 'kpi.instructor'
  }
  if (
    ctx.participant.volunteer &&
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.volunteer'))
  ) {
    return 'kpi.volunteer'
  }
  if (!ctx.participant.individual) {
    if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.dispatchedSchool'))) {
      return 'kpi.dispatchedSchool'
    }
    if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.dispatchedClass'))) {
      return 'kpi.dispatchedClass'
    }
  }
  return null
}

function findIncompleteWageReason(overlay: Record<string, unknown>): string | null {
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade1Fee'))) {
    return 'wage.grade1Fee'
  }
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade2Fee'))) {
    return 'wage.grade2Fee'
  }
  if (isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade3Fee'))) {
    return 'wage.grade3Fee'
  }
  const paymentItems = readOverlay(overlay, 'generalRegistration.wageInfo.paymentItemValues')
  if (!Array.isArray(paymentItems) || paymentItems.length === 0) return 'wage.paymentItemValues'
  return null
}

function findIncompleteTypeSettingsReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  const showParticipation = !ctx.participant.organization
  if (ctx.sessionRoundType === 'multi') {
    if (
      ctx.educationFormScheduleDetail === 'common' &&
      isEmptyText(resolveGeneralRegistrationCommonEducationForm(overlay))
    ) {
      return 'typeSettings.multiCommonEducationForm'
    }
    if (
      showParticipation &&
      ctx.participationScheduleDetail === 'common' &&
      isEmptyText(resolveGeneralRegistrationCommonParticipation(overlay))
    ) {
      return 'typeSettings.multiCommonParticipation'
    }
  }
  if (ctx.ipsScheduleDetail === 'common') {
    if (isIpsIncomplete(readOverlay(overlay, 'generalRegistration.typeSettings.ipsType'))) {
      return 'typeSettings.ipsType'
    }
  }
  return null
}

function findIncompleteCurriculumReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  if (ctx.programType !== 'curriculum') return null
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
      if (isEmptyText(unitNames[index])) return `curriculum.unitName[${index}]`
      if (isEmptyText(unitContents[index])) return `curriculum.unitContent[${index}]`
      if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index])) {
        return `curriculum.ips[${index}]`
      }
    }
    return null
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
  const assignmentByRound = readIndexRecord(
    overlay,
    'generalRegistration.educationCurriculum.assignmentByRound'
  )
  for (let index = 1; index <= roundCount; index += 1) {
    if (isEmptyText(progressByRound[index])) return `curriculum.progressSession[${index}]`
    if (isEmptyText(roundContents[index])) return `curriculum.roundContent[${index}]`
    if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index])) {
      return `curriculum.ips[${index}]`
    }
    // 학교/기관 대상은 과제 UI 비노출 — 잔존 overlay로 미완료 처리하지 않음 (일정형과 동일)
    if (!ctx.participant.organization && isAssignmentIncomplete(assignmentByRound[index])) {
      return `curriculum.assignment[${index}]`
    }
  }
  if (ctx.scheduleCurriculumPreEducation) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationCurriculum.preEducationScheduleName'
    )
    if (preEducationName !== undefined && isEmptyText(preEducationName)) {
      return 'curriculum.preEducationScheduleName'
    }
    if (
      isEmptyText(readOverlay(overlay, 'generalRegistration.educationCurriculum.preEducationScheduleLine'))
    ) {
      return 'curriculum.preEducationScheduleLine'
    }
  }
  return null
}

function findIncompleteScheduleCurriculumReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  if (ctx.programType !== 'schedule') return null
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
  const assignmentByDetail = readIndexRecord(
    overlay,
    'generalRegistration.educationScheduleCurriculum.assignmentByDetail'
  )
  const groupCount =
    ctx.sessionRoundType === 'multi' ? 1 : Math.max(1, ctx.scheduleCurriculumGroupCount)

  for (let index = 1; index <= detailCount; index += 1) {
    if (isEmptyText(eventNames[index])) return `scheduleCurriculum.eventName[${index}]`
    if (ctx.sessionRoundType === 'multi' && ctx.educationFormScheduleDetail === 'perSchedule') {
      if (isEmptyText(scheduleDates[index])) return `scheduleCurriculum.scheduleDate[${index}]`
    } else {
      const slots = groupTimes[index]
      if (!Array.isArray(slots) || slots.length < groupCount) {
        return `scheduleCurriculum.groupTimes[${index}]`
      }
      if (isGroupTimeIncomplete(slots.slice(0, groupCount))) {
        return `scheduleCurriculum.groupTimes[${index}]`
      }
    }
    if (ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsByDetail[index])) {
      return `scheduleCurriculum.ips[${index}]`
    }
    if (!ctx.participant.organization && isAssignmentIncomplete(assignmentByDetail[index])) {
      return `scheduleCurriculum.assignment[${index}]`
    }
  }
  if (ctx.scheduleCurriculumPreEducation) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationScheduleCurriculum.preEducationName'
    )
    if (preEducationName !== undefined && isEmptyText(preEducationName)) {
      return 'scheduleCurriculum.preEducationName'
    }
  }
  return null
}

function findIncompleteEducationScheduleSettingsReason(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  if (hideEducationScheduleSettings(ctx.programType, ctx.sessionRoundType)) return null
  const lines = readOverlay(overlay, GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY)
  if (Array.isArray(lines) && lines.some(line => typeof line === 'string' && line.trim())) {
    return null
  }
  if (ctx.educationScheduleMode === 'period') {
    if (isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.periodDateIso'))) {
      return 'educationScheduleSettings.periodDateIso'
    }
    return null
  }
  if (isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.singleDateIso'))) {
    return 'educationScheduleSettings.singleDateIso'
  }
  return null
}

/**
 * 일반 프로그램 등록 1단계(공통 정보) — 어느 필수 필드가 비어 있는지 진단용 reason.
 * `null`이면 완료. 값이 있으면 `<section>.<field>[index?]` 형태의 진단 키.
 * 콘솔 디버깅·문의 대응용 — UI 문구에는 노출하지 않는다.
 */
export function describeIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  return (
    findIncompleteBasicInfoReason(overlay, ctx) ??
    findIncompleteKpiReason(overlay, ctx) ??
    findIncompleteWageReason(overlay) ??
    findIncompleteTypeSettingsReason(overlay, ctx) ??
    findIncompleteCurriculumReason(overlay, ctx) ??
    findIncompleteScheduleCurriculumReason(overlay, ctx) ??
    findIncompleteEducationScheduleSettingsReason(overlay, ctx) ??
    null
  )
}

/** 일반 프로그램 등록 1단계(공통 정보) — 필수 필드 미입력 여부 */
export function hasIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  return describeIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx) != null
}
