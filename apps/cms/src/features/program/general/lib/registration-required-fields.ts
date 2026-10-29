/**
 * 일반 프로그램 등록 1단계 필수 검사.
 *
 * 정책: UI가 보여주는 기본값(`online` / `individual` / 「사전 교육」 등)이 overlay에
 * 아직 안 적혀 있어도 미입력으로 보지 않는다. create 매핑과 같은 resolver를 쓴다.
 * IPS 1차·직접 입력 텍스트·금액처럼 기본값이 없는 항목만 비어 있으면 막는다.
 *
 * 1사1교는 `economy-program-registration-required-fields`가 같은 정책(readText fallback).
 * 교육받은 교사는 `omitKpiAndWage` + `preEducationDisplayMode` 로 이 함수를 재사용한다.
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
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-keys'
import { isDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import {
  PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import { isEducationScheduleProgressLineMissingOrWithoutClock } from '@/features/template/lib/education-schedule-line-clock-required'
import {
  listIncompleteEducationPlaceReasons,
  resolveEducationPlaceCommonEducationForm,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-place-rules'

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
  /** 교육받은 교사 — KPI·임금 단락 없음 */
  omitKpiAndWage?: boolean
  /** 후원사 「전체」 허용 (교육받은 교사) */
  allowEmptySponsor?: boolean
  /**
   * 사전 교육/교육 연수 블록.
   * prepend=일반 사전 교육(index 0), replaceFirst=교육받은 교사 교육 연수(첫 차시/회차·세부 일정)
   */
  preEducationDisplayMode?: 'prepend' | 'replaceFirst'
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

function resolveScheduleCurriculumIpsByDetail(
  ipsByDetail: Record<number, unknown>,
  index: number
): ProgramRegistrationIpsTypeValue {
  const raw = ipsByDetail[index]
  if (raw != null && typeof raw === 'object' && !isEmptyText((raw as { category?: unknown }).category)) {
    return raw as ProgramRegistrationIpsTypeValue
  }
  return PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT
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

function pushReason(reasons: string[], incomplete: boolean, reason: string) {
  if (incomplete) reasons.push(reason)
}

/** 비어 있는 기본 정보 필수 항목 */
function findIncompleteBasicInfoReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  const reasons: string[] = []
  pushReason(reasons, isEmptyText(ctx.programTitleKo), 'basicInfo.programTitleKo')
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.programTitleEn')),
    'basicInfo.programTitleEn'
  )
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.publicProgramTitle')),
    'basicInfo.publicProgramTitle'
  )
  // 일정형: 세부 프로그램명「해당없음」고정 — 선택 검증 생략(실적에서는 일정명 반영)
  // 커리큘럼형: BE가 세부 프로그램 마스터 id(숫자)를 요구한다 — 「해당없음」 sentinel·name-only 는 미완료.
  if (ctx.programType !== 'schedule') {
    pushReason(
      reasons,
      !isDetailedProgramMasterId(readOverlay(overlay, 'generalRegistration.basicInfo.detailedProgramId')),
      'basicInfo.detailedProgram'
    )
  }
  const operationRange = readOverlay(overlay, 'generalRegistration.basicInfo.operationRangeSeal')
  if (operationRange == null || typeof operationRange !== 'object') {
    reasons.push('basicInfo.operationRangeSeal')
  } else {
    const range = operationRange as { start?: unknown; end?: unknown }
    pushReason(
      reasons,
      isEmptyText(range.start) || isEmptyText(range.end),
      'basicInfo.operationRangeSeal'
    )
  }
  pushReason(reasons, !hasAudience(ctx.participant), 'basicInfo.audience')
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.businessField')),
    'basicInfo.businessField'
  )
  if (!ctx.allowEmptySponsor) {
    pushReason(reasons, isEmptyText(ctx.sponsorId), 'basicInfo.sponsorId')
    // 담당자 「미선택」 sentinel은 명시 선택이다. 빈 값만 미입력으로 본다.
    pushReason(reasons, isEmptyText(ctx.sponsorContactId), 'basicInfo.sponsorContactId')
  }
  // 교육 장소 상세 텍스트 — 「기타(직접입력)」선택 시에만 필수
  const venueKind = readOverlay(overlay, 'generalRegistration.basicInfo.educationVenueKind')
  pushReason(
    reasons,
    venueKind === 'other' &&
      isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationVenueDetail')),
    'basicInfo.educationVenueDetail'
  )
  // 설문 진행 항목 — 0개 선택도 완료 (선택)
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.educationCourse')),
    'basicInfo.educationCourse'
  )
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.ipOwned')),
    'basicInfo.ipOwned'
  )
  pushReason(
    reasons,
    isEmptyText(readOverlay(overlay, 'generalRegistration.basicInfo.courseDeliveredBy')),
    'basicInfo.courseDeliveredBy'
  )
  return reasons
}

function findIncompleteKpiReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  if (ctx.omitKpiAndWage) return []
  const reasons: string[] = []
  pushReason(
    reasons,
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.participantCount')),
    'kpi.participantCount'
  )
  pushReason(
    reasons,
    ctx.participant.teacherInstructor &&
      isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.instructor')),
    'kpi.instructor'
  )
  pushReason(
    reasons,
    ctx.participant.volunteer &&
      isEmptyNumber(readOverlay(overlay, 'generalRegistration.kpi.volunteer')),
    'kpi.volunteer'
  )
  return reasons
}

function findIncompleteWageReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  if (ctx.omitKpiAndWage) return []
  const reasons: string[] = []
  pushReason(
    reasons,
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade1Fee')),
    'wage.grade1Fee'
  )
  pushReason(
    reasons,
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade2Fee')),
    'wage.grade2Fee'
  )
  pushReason(
    reasons,
    isEmptyNumber(readOverlay(overlay, 'generalRegistration.wageInfo.grade3Fee')),
    'wage.grade3Fee'
  )
  const paymentItems = readOverlay(overlay, 'generalRegistration.wageInfo.paymentItemValues')
  pushReason(
    reasons,
    !Array.isArray(paymentItems) || paymentItems.length === 0,
    'wage.paymentItemValues'
  )
  return reasons
}

function findIncompleteTypeSettingsReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  const reasons: string[] = []
  const showParticipation = !ctx.participant.organization
  if (ctx.sessionRoundType === 'multi') {
    pushReason(
      reasons,
      ctx.educationFormScheduleDetail === 'common' &&
        isEmptyText(resolveGeneralRegistrationCommonEducationForm(overlay)),
      'typeSettings.multiCommonEducationForm'
    )
    pushReason(
      reasons,
      showParticipation &&
        ctx.participationScheduleDetail === 'common' &&
        isEmptyText(resolveGeneralRegistrationCommonParticipation(overlay)),
      'typeSettings.multiCommonParticipation'
    )
  }
  pushReason(
    reasons,
    ctx.ipsScheduleDetail === 'common' &&
      isIpsIncomplete(readOverlay(overlay, 'generalRegistration.typeSettings.ipsType')),
    'typeSettings.ipsType'
  )
  return reasons
}

function findIncompleteCurriculumReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  if (ctx.programType !== 'curriculum') return []
  const reasons: string[] = []
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
      pushReason(reasons, isEmptyText(unitNames[index]), `curriculum.unitName[${index}]`)
      pushReason(reasons, isEmptyText(unitContents[index]), `curriculum.unitContent[${index}]`)
      pushReason(
        reasons,
        ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index]),
        `curriculum.ips[${index}]`
      )
    }
  } else {
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
      pushReason(
        reasons,
        isEmptyText(progressByRound[index]),
        `curriculum.progressSession[${index}]`
      )
      pushReason(reasons, isEmptyText(roundContents[index]), `curriculum.roundContent[${index}]`)
      pushReason(
        reasons,
        ctx.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(ipsBySession[index]),
        `curriculum.ips[${index}]`
      )
      // 학교/기관 대상은 과제 UI 비노출 — 잔존 overlay로 미완료 처리하지 않음 (일정형과 동일)
      pushReason(
        reasons,
        !ctx.participant.organization && isAssignmentIncomplete(assignmentByRound[index]),
        `curriculum.assignment[${index}]`
      )
    }
  }
  const replaceFirstTraining =
    ctx.scheduleCurriculumPreEducation && ctx.preEducationDisplayMode === 'replaceFirst'
  if (ctx.scheduleCurriculumPreEducation && !replaceFirstTraining) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationCurriculum.preEducationScheduleName'
    )
    pushReason(
      reasons,
      preEducationName !== undefined && isEmptyText(preEducationName),
      'curriculum.preEducationScheduleName'
    )
    pushReason(
      reasons,
      isEducationScheduleProgressLineMissingOrWithoutClock(
        readOverlay(overlay, 'generalRegistration.educationCurriculum.preEducationScheduleLine') as
          | string
          | null
          | undefined
      ),
      'curriculum.preEducationScheduleLine'
    )
  }
  return reasons
}

function findIncompleteScheduleCurriculumReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  if (ctx.programType !== 'schedule') return []
  const reasons: string[] = []
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

  const replaceFirstTraining =
    ctx.scheduleCurriculumPreEducation && ctx.preEducationDisplayMode === 'replaceFirst'
  /** `shouldUseScheduleEventBlockLayout` — 복수 회차 일정형은 유형 설정과 무관하게 진행 일정(date) 필드 */
  const useEventScheduleDate = ctx.sessionRoundType === 'multi'

  for (let index = 1; index <= detailCount; index += 1) {
    const skipFixedTrainingName = replaceFirstTraining && index === 1
    pushReason(
      reasons,
      !skipFixedTrainingName && isEmptyText(eventNames[index]),
      `scheduleCurriculum.eventName[${index}]`
    )
    if (useEventScheduleDate) {
      pushReason(
        reasons,
        isEducationScheduleProgressLineMissingOrWithoutClock(scheduleDates[index] as string),
        `scheduleCurriculum.scheduleDate[${index}]`
      )
    } else {
      const slots = groupTimes[index]
      const groupTimesIncomplete =
        !Array.isArray(slots) ||
        slots.length < groupCount ||
        isGroupTimeIncomplete(slots.slice(0, groupCount))
      pushReason(reasons, groupTimesIncomplete, `scheduleCurriculum.groupTimes[${index}]`)
    }
    pushReason(
      reasons,
      ctx.ipsScheduleDetail === 'perSchedule' &&
        isIpsIncomplete(resolveScheduleCurriculumIpsByDetail(ipsByDetail, index)),
      `scheduleCurriculum.ips[${index}]`
    )
    pushReason(
      reasons,
      !ctx.participant.organization && isAssignmentIncomplete(assignmentByDetail[index]),
      `scheduleCurriculum.assignment[${index}]`
    )
  }
  if (ctx.scheduleCurriculumPreEducation && !replaceFirstTraining) {
    // UI 기본값「사전 교육」은 overlay 미기록일 수 있음 — 명시적으로 비운 경우만 미완료
    const preEducationName = readOverlay(
      overlay,
      'generalRegistration.educationScheduleCurriculum.preEducationName'
    )
    pushReason(
      reasons,
      preEducationName !== undefined && isEmptyText(preEducationName),
      'scheduleCurriculum.preEducationName'
    )
    pushReason(
      reasons,
      isEducationScheduleProgressLineMissingOrWithoutClock(scheduleDates[0] as string),
      'scheduleCurriculum.preEducationScheduleDate'
    )
  }
  return reasons
}

/** 교육 진행 장소 — 일반 등록·참여자 <개인> 전용. 교육 형태 「온라인」 행은 제외 */
function findIncompleteEducationPlaceReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): { typeSettings: string[]; rows: string[] } {
  const isSchedule = ctx.programType === 'schedule'
  return listIncompleteEducationPlaceReasons({
    enabled:
      ctx.participant.individual && !ctx.participant.organization && ctx.omitKpiAndWage !== true,
    programType: isSchedule ? 'schedule' : 'curriculum',
    sessionRoundType: ctx.sessionRoundType,
    educationFormScheduleDetail: ctx.educationFormScheduleDetail,
    commonEducationForm: resolveEducationPlaceCommonEducationForm({
      sessionRoundType: ctx.sessionRoundType,
      singleEducationForm: readOverlay(overlay, 'generalRegistration.typeSettings.singleEducationForm'),
      multiCommonEducationForm: readOverlay(
        overlay,
        'generalRegistration.typeSettings.multiCommonEducationForm'
      ),
    }),
    educationFormByIndex: readIndexRecord(
      overlay,
      isSchedule
        ? 'generalRegistration.educationScheduleCurriculum.educationFormByDetail'
        : 'generalRegistration.educationCurriculum.educationFormBySession'
    ),
    placeScheduleDetail: readOverlay(
      overlay,
      'generalRegistration.typeSettings.educationPlaceScheduleDetail'
    ),
    placeAddress: readOverlay(overlay, 'generalRegistration.typeSettings.educationPlaceAddress'),
    placeByIndex: readIndexRecord(
      overlay,
      isSchedule
        ? 'generalRegistration.educationScheduleCurriculum.educationPlaceByDetail'
        : 'generalRegistration.educationCurriculum.educationPlaceBySession'
    ),
    rowCount: isSchedule
      ? ctx.scheduleCurriculumDetailCount
      : ctx.sessionRoundType === 'single'
        ? ctx.curriculumChartSessionCount
        : ctx.curriculumSessionCount,
    skipFirstRow: ctx.scheduleCurriculumPreEducation && ctx.preEducationDisplayMode === 'replaceFirst',
  })
}

function countNonEmptyEducationScheduleLines(overlay: Record<string, unknown>): number {
  const lines = readOverlay(overlay, GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY)
  if (!Array.isArray(lines)) return 0
  return lines.filter(line => typeof line === 'string' && line.trim() !== '').length
}

export const EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_TITLE = '교육 일정 불일치 안내'
export const EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_MESSAGE =
  '교육 진행 예정일과 교육 진행 회차의 수가 일치하지 않습니다.\n회차 수에 맞게 진행 예정일을 등록해 주세요.'

/**
 * 커리큘럼형 + 복수 회차 + 날짜 지정 — 회차 수와 교육 진행 예정일 줄 수가 다른지.
 * 예정일이 비어 있으면 필수 검사가 담당하므로 여기서는 보지 않는다.
 * 사전교육 진행 일정은 별도 필드이므로 교육 진행 예정일 줄 수와 비교하지 않는다.
 */
export function hasCurriculumMultiDateScheduleCountMismatch(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (ctx.programType !== 'curriculum') return false
  if (ctx.sessionRoundType !== 'multi') return false
  if (ctx.educationScheduleMode !== 'date') return false
  const lineCount = countNonEmptyEducationScheduleLines(overlay)
  if (lineCount === 0) return false
  return lineCount !== Math.max(1, ctx.curriculumSessionCount)
}

function findIncompleteEducationScheduleSettingsReasons(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  if (hideEducationScheduleSettings(ctx.programType, ctx.sessionRoundType)) return []
  const lines = readOverlay(overlay, GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY)
  if (Array.isArray(lines) && lines.some(line => typeof line === 'string' && line.trim())) {
    return []
  }
  if (ctx.educationScheduleMode === 'period') {
    return isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.periodDateIso'))
      ? ['educationScheduleSettings.periodDateIso']
      : []
  }
  return isEmptyText(readOverlay(overlay, 'generalRegistration.educationScheduleSettings.singleDateIso'))
    ? ['educationScheduleSettings.singleDateIso']
    : []
}

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  'basicInfo.programTitleKo': '대표 프로그램명 (국문)',
  'basicInfo.programTitleEn': '대표 프로그램명 (영문)',
  'basicInfo.publicProgramTitle': '공고용 프로그램명',
  'basicInfo.detailedProgram': '세부 프로그램명',
  'basicInfo.operationRangeSeal': '사업 운영 기간',
  'basicInfo.audience': '참여자 유형',
  'basicInfo.businessField': '사업 분야',
  'basicInfo.sponsorId': '후원사',
  'basicInfo.sponsorContactId': '후원사 담당자',
  'basicInfo.educationVenueDetail': '교육 장소',
  'basicInfo.educationCourse': '교육 과정',
  'basicInfo.ipOwned': 'IP Owned',
  'basicInfo.courseDeliveredBy': 'Course Delivered By',
  'kpi.participantCount': '참여 인원',
  'kpi.instructor': '강사 수',
  'kpi.volunteer': '봉사자 수',
  'wage.grade1Fee': '1급 강사비',
  'wage.grade2Fee': '2급 강사비',
  'wage.grade3Fee': '3급 강사비',
  'wage.paymentItemValues': '지급 항목',
  'typeSettings.multiCommonEducationForm': '교육 형태',
  'typeSettings.multiCommonParticipation': '참여 방식',
  'typeSettings.ipsType': 'IPS 유형',
  'typeSettings.educationPlace': '교육 진행 장소',
  'curriculum.educationPlace': '교육 진행 장소',
  'scheduleCurriculum.educationPlace': '교육 진행 장소',
  'curriculum.unitName': '단원명',
  'curriculum.unitContent': '교육 내용',
  'curriculum.ips': 'IPS 유형',
  'curriculum.progressSession': '진행 차시',
  'curriculum.roundContent': '회차 교육 내용',
  'curriculum.assignment': '과제 설정',
  'curriculum.preEducationScheduleName': '교육 연수명',
  'scheduleCurriculum.eventName': '일정명',
  'scheduleCurriculum.scheduleDate': '진행 일정(시간 포함)',
  'scheduleCurriculum.groupTimes': '진행 일정',
  'scheduleCurriculum.ips': 'IPS 유형',
  'scheduleCurriculum.assignment': '과제 설정',
  'scheduleCurriculum.preEducationName': '교육 연수명',
  'scheduleCurriculum.preEducationScheduleDate': '진행 일정(시간 포함)',
  'curriculum.preEducationScheduleLine': '진행 일정(시간 포함)',
  'educationScheduleSettings.periodDateIso': '교육 진행 예정일',
  'educationScheduleSettings.singleDateIso': '교육 진행 예정일',
}

/** 진단 키를 화면 라벨로 바꾼다. 차시·세부 일정 인덱스가 있으면 앞에 붙인다. */
export function formatGeneralProgramRegistrationRequiredFieldReason(reason: string): string {
  const indexed = /^(.+)\[(\d+)\]$/.exec(reason)
  const key = indexed?.[1] ?? reason
  const index = indexed?.[2]
  const label = REQUIRED_FIELD_LABELS[key] ?? reason
  if (index == null) return label
  if (key.startsWith('scheduleCurriculum.')) return `세부 일정 ${index} ${label}`
  if (key.startsWith('curriculum.')) return `${index}차시 ${label}`
  return `${label} (${index})`
}

/** 비어 있는 필수 항목 진단 키. 비어 있으면 완료. */
export function listIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  const educationPlace = findIncompleteEducationPlaceReasons(overlay, ctx)
  return [
    ...findIncompleteBasicInfoReasons(overlay, ctx),
    ...findIncompleteKpiReasons(overlay, ctx),
    ...findIncompleteWageReasons(overlay, ctx),
    ...findIncompleteTypeSettingsReasons(overlay, ctx),
    ...educationPlace.typeSettings,
    ...findIncompleteCurriculumReasons(overlay, ctx),
    ...findIncompleteScheduleCurriculumReasons(overlay, ctx),
    ...educationPlace.rows,
    ...findIncompleteEducationScheduleSettingsReasons(overlay, ctx),
  ]
}

/**
 * 일반 프로그램 등록 1단계(공통 정보) — 처음 발견된 미입력 필수 필드.
 * `null`이면 완료. 값이 있으면 `<section>.<field>[index?]` 형태의 진단 키.
 */
export function describeIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string | null {
  return listIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx)[0] ?? null
}

/** 일반 프로그램 등록 1단계(공통 정보) — 필수 필드 미입력 여부 */
export function hasIncompleteGeneralProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  return describeIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx) != null
}
