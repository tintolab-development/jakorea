/**
 * 일반 프로그램 상세 — 봉사자 면접 진행 가능 일정 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
 */

import type {
  GeneralProgramVolunteerInterviewScheduleException,
  GeneralProgramVolunteerInterviewScheduleInfo,
  Program,
  ProgramVolunteerInterviewConfig,
} from '@/types/domain'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { formatDateOnly } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import {
  applyGeneralRecruitOverlayToProgram,
  formatAvailableTimeSlotsFromInterviewTimeRange,
  formatAvailableTimeSlotsFromSelectedKeys,
  resolveVolunteerInterviewAvailableTimeSlotsForDisplay,
  volunteerInterviewHasSelectedSlotKeys,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-keys'
import dayjs from 'dayjs'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'

export type { VolunteerInterviewScheduleEditSeed }

export type GeneralProgramVolunteerInterviewScheduleDisplay = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
  exceptions: GeneralProgramVolunteerInterviewScheduleException[]
}

function readRegistrationOverlay(program: Program): Record<string, unknown> {
  const overlay = program.registrationOverlay
  if (overlay == null || typeof overlay !== 'object' || Array.isArray(overlay)) return {}
  return overlay as Record<string, unknown>
}

function resolveVolunteerInterviewExceptions(
  program: Program
): GeneralProgramVolunteerInterviewScheduleException[] {
  const fromOverlay = mapVolunteerInterviewExceptionsFromOverlay(readRegistrationOverlay(program))
  if (fromOverlay.length > 0) return fromOverlay
  return program.generalCommonInfo?.volunteerInterviewScheduleInfo?.exceptions ?? []
}

function dashOr(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function resolveAvailableTimeSlotsDisplay(
  nestedAvailableTimeSlots: string | undefined,
  overlay: Record<string, unknown>
): string {
  return dashOr(
    resolveVolunteerInterviewAvailableTimeSlotsForDisplay(
      nestedAvailableTimeSlots,
      overlay,
      'recruit'
    )
  )
}

function resolveVolunteerInterviewScheduleProgramForDisplay(program: Program): Program {
  const overlay = readRegistrationOverlay(program)
  if (Object.keys(overlay).length === 0) return program
  return applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: false })
}

function parseInterviewTimeRangeFromOverlay(
  overlay: Record<string, unknown>
): VolunteerInterviewScheduleEditSeed['interviewTimeRange'] | undefined {
  return parseInterviewTimeRange(
    overlay[buildVolunteerInterviewOverlayKey('recruit', 'interviewTimeRange')]
  )
}

function parseInterviewTimeRange(
  raw: unknown
): VolunteerInterviewScheduleEditSeed['interviewTimeRange'] | undefined {
  if (!Array.isArray(raw) || raw.length < 2) return undefined
  const start = dayjs(raw[0] as string | number | Date)
  const end = dayjs(raw[1] as string | number | Date)
  if (!start.isValid() || !end.isValid()) return undefined
  return {
    startHour: start.hour(),
    startMinute: start.minute(),
    endHour: end.hour(),
    endMinute: end.minute(),
  }
}

function parseInterviewTimeUnitFromOverlay(
  overlay: Record<string, unknown>
): VolunteerInterviewScheduleEditSeed['timeUnit'] | undefined {
  return parseInterviewTimeUnit(overlay[buildVolunteerInterviewOverlayKey('recruit', 'timeUnit')])
}

function parseInterviewTimeUnit(
  raw: unknown
): VolunteerInterviewScheduleEditSeed['timeUnit'] | undefined {
  if (raw === '15' || raw === 15) return '15'
  if (raw === '60' || raw === 60) return '60'
  if (raw === '30' || raw === 30) return '30'
  return undefined
}

function selectedSlotLabelsFromOverlay(overlay: Record<string, unknown>): string[] {
  if (!volunteerInterviewHasSelectedSlotKeys(overlay, 'recruit')) return []
  return splitSlotLabels(
    formatAvailableTimeSlotsFromSelectedKeys(
      overlay[buildVolunteerInterviewOverlayKey('recruit', 'selectedSlotKeys')]
    )
  )
}

function splitSlotLabels(formatted: string | undefined): string[] {
  if (!formatted) return []
  return formatted
    .split(',')
    .map(label => label.trim())
    .filter(Boolean)
}

function dateLabel(iso: string | undefined | null): string | undefined {
  const trimmed = iso?.trim()
  if (!trimmed) return undefined
  const formatted = formatDateOnly(trimmed)
  return formatted === '-' ? trimmed : formatted
}

/**
 * 서버 표시 객체 → 화면 값. overlay 로 다시 계산하지 않는다.
 * - 불가일: `specificUnavailableDateIsos` 가 배열이면 그 값만(`[]` = 없음). 키가 없을 때만 서버 문구 `specificUnavailableDates`.
 * - 예외: 서버 `exceptions[]`({exceptionDateIso, availableTimeSlots}) 순서 그대로.
 */
function displayFromServerScheduleInfo(
  info: GeneralProgramVolunteerInterviewScheduleInfo | null
): GeneralProgramVolunteerInterviewScheduleDisplay {
  const isos = Array.isArray(info?.specificUnavailableDateIsos)
    ? info.specificUnavailableDateIsos
    : undefined
  const specific = isos
    ? isos
        .map(dateLabel)
        .filter((label): label is string => label != null)
        .join(', ')
    : info?.specificUnavailableDates
  const exceptions = Array.isArray(info?.exceptions) ? info.exceptions : []
  return {
    recurringUnavailable: dashOr(info?.recurringUnavailable),
    specificUnavailableDates: dashOr(specific),
    availableTimeSlots: dashOr(info?.availableTimeSlots),
    exceptions: exceptions.map((exception, index) => {
      const label = dateLabel(exception.exceptionDateIso) ?? exception.exceptionDate?.trim()
      return {
        blockId: index + 1,
        ...(label ? { exceptionDate: label } : {}),
        ...(exception.exceptionDateIso ? { exceptionDateIso: exception.exceptionDateIso } : {}),
        ...(exception.availableTimeSlots
          ? { availableTimeSlots: exception.availableTimeSlots }
          : {}),
      }
    }),
  }
}

/**
 * typed 불가일 — 직접 지정(specific)과 적용(applied)의 합집합, 날짜순.
 * BE 표시 복사본(`specificUnavailableDateIsos`)은 specific 이 있으면 specific 만 담지만(포털·미리보기용),
 * 면접 슬롯 판정(allowsSlot)은 합집합을 막으므로 CMS 는 합집합을 보여 준다(keonhee 2026-10-25).
 */
export function typedVolunteerInterviewUnavailableDateIsos(
  config: ProgramVolunteerInterviewConfig
): string[] {
  const all = [
    ...(config.specificUnavailableDates ?? []),
    ...(config.appliedUnavailableDates ?? []),
  ]
    .map(date => (typeof date === 'string' ? date.trim().slice(0, 10) : ''))
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
  return [...new Set(all)].sort()
}

function typedRecurringUnavailable(
  config: ProgramVolunteerInterviewConfig,
  fallback: string | undefined
): string | undefined {
  const state = config.exclusionState
  if (state == null) return fallback
  return buildRecurringUnavailableLabel({
    excludeNone: false,
    excludeSaturday: state.excludeSaturday === true,
    excludeSunday: state.excludeSunday === true,
    excludeHoliday: state.excludeHoliday === true,
  })
}

function typedAvailableTimeSlots(
  config: ProgramVolunteerInterviewConfig,
  fallback: string | undefined
): string | undefined {
  return (
    formatAvailableTimeSlotsFromSelectedKeys(config.selectedSlotKeys ?? []) ??
    formatAvailableTimeSlotsFromInterviewTimeRange(config.interviewTimeRange, config.timeUnit) ??
    fallback
  )
}

/**
 * 봉사 행 typed → 화면 값. 불가일은 specific ∪ applied. 반복 불가·시간대·예외가 typed 에 없으면 서버 표시 객체 값.
 */
function displayFromTypedConfig(
  config: ProgramVolunteerInterviewConfig,
  server: GeneralProgramVolunteerInterviewScheduleInfo | null | undefined
): GeneralProgramVolunteerInterviewScheduleDisplay {
  const fromServer = displayFromServerScheduleInfo(server ?? null)
  const exceptions = Array.isArray(config.exceptions)
    ? config.exceptions.map((exception, index) => {
        const iso = exception.exceptionDate?.trim().slice(0, 10)
        const label = dateLabel(iso)
        const slots = formatAvailableTimeSlotsFromSelectedKeys(exception.selectedSlotKeys ?? [])
        return {
          blockId: index + 1,
          ...(label ? { exceptionDate: label } : {}),
          ...(iso ? { exceptionDateIso: iso } : {}),
          ...(slots ? { availableTimeSlots: slots } : {}),
        }
      })
    : fromServer.exceptions
  return {
    recurringUnavailable: dashOr(
      typedRecurringUnavailable(config, server?.recurringUnavailable ?? undefined)
    ),
    specificUnavailableDates: dashOr(
      typedVolunteerInterviewUnavailableDateIsos(config)
        .map(dateLabel)
        .filter((label): label is string => label != null)
        .join(', ')
    ),
    availableTimeSlots: dashOr(
      typedAvailableTimeSlots(config, server?.availableTimeSlots ?? undefined)
    ),
    exceptions,
  }
}

/**
 * 상세 「면접 진행 가능 일정」 표시(CMS). 우선순위(part7, keonhee 2026-10-25):
 * 1. 봉사 행 typed `interviewConfig`(`volunteerInterviewConfigFromServer`) — 불가일은 specific ∪ applied
 * 2. GET `generalCommonInfo.volunteerInterviewScheduleInfo`(typed 없는 구 프로그램 — BE 가 overlay 로 만든 값)
 * 3. 서버 조회가 아닌 Program(등록 미리보기·mock) — overlay 계산
 */
export function resolveGeneralProgramVolunteerInterviewScheduleDisplay(
  program: Program
): GeneralProgramVolunteerInterviewScheduleDisplay {
  if (program.volunteerInterviewConfigFromServer != null) {
    return displayFromTypedConfig(
      program.volunteerInterviewConfigFromServer,
      program.volunteerInterviewScheduleInfoFromServer
    )
  }
  return resolveGeneralProgramVolunteerInterviewSchedulePreviewDisplay(program)
}

/**
 * 신청자 화면(포털)과 같은 표시 — GET 서버 표시 객체(`specificUnavailableDateIsos` = specific 우선 복사본).
 * 서버 조회가 아닌 Program 은 overlay 계산. 신청폼 미리보기 seed 에만 쓴다.
 */
function resolveGeneralProgramVolunteerInterviewSchedulePreviewDisplay(
  program: Program
): GeneralProgramVolunteerInterviewScheduleDisplay {
  if (program.volunteerInterviewScheduleInfoFromServer !== undefined) {
    return displayFromServerScheduleInfo(program.volunteerInterviewScheduleInfoFromServer)
  }
  const overlay = readRegistrationOverlay(program)
  const merged = resolveVolunteerInterviewScheduleProgramForDisplay(program)
  const nestedInfo = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const mergedInfo = merged.generalCommonInfo?.volunteerInterviewScheduleInfo

  return {
    recurringUnavailable: dashOr(mergedInfo?.recurringUnavailable),
    specificUnavailableDates: dashOr(mergedInfo?.specificUnavailableDates),
    availableTimeSlots: resolveAvailableTimeSlotsDisplay(nestedInfo?.availableTimeSlots, overlay),
    exceptions: resolveVolunteerInterviewExceptions(merged),
  }
}

/**
 * 상세 수정 모드 초기값(CMS). typed 가 있으면 typed(불가일 specific ∪ applied — 수정 화면은 applied 로 저장),
 * 없으면 서버 표시 객체·overlay(구 프로그램).
 */
export function resolveGeneralProgramVolunteerInterviewScheduleEditSeed(
  program: Program
): VolunteerInterviewScheduleEditSeed | undefined {
  const config = program.volunteerInterviewConfigFromServer
  if (config == null) return resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed(program)
  const display = displayFromTypedConfig(config, program.volunteerInterviewScheduleInfoFromServer)
  const dateIsos = typedVolunteerInterviewUnavailableDateIsos(config)
  const selectedTimeSlotLabels = splitSlotLabels(
    formatAvailableTimeSlotsFromSelectedKeys(config.selectedSlotKeys ?? [])
  )
  const interviewTimeRange = parseInterviewTimeRange(config.interviewTimeRange)
  if (
    display.recurringUnavailable === '-' &&
    dateIsos.length === 0 &&
    selectedTimeSlotLabels.length === 0 &&
    !interviewTimeRange
  ) {
    return undefined
  }
  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable: display.recurringUnavailable === '-' ? '' : display.recurringUnavailable,
    specificUnavailableDateIsos: dateIsos,
    selectedTimeSlotLabels,
    interviewTimeRange,
    timeUnit: parseInterviewTimeUnit(config.timeUnit),
  })
}

/**
 * 신청폼 미리보기 seed — 신청자 화면과 같은 서버 표시 객체(`specificUnavailableDateIsos`) 기준.
 * 시간대는 overlay(조회 시 typed 로 맞춘 값). CMS 수정 화면은 `resolveGeneralProgramVolunteerInterviewScheduleEditSeed`.
 */
export function resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed(
  program: Program
): VolunteerInterviewScheduleEditSeed | undefined {
  const display = resolveGeneralProgramVolunteerInterviewSchedulePreviewDisplay(program)
  const overlay = readRegistrationOverlay(program)
  const info =
    resolveVolunteerInterviewScheduleProgramForDisplay(program).generalCommonInfo
      ?.volunteerInterviewScheduleInfo
  const interviewTimeRange = parseInterviewTimeRangeFromOverlay(overlay)
  const selectedTimeSlotLabels = selectedSlotLabelsFromOverlay(overlay)

  if (
    display.recurringUnavailable === '-' &&
    display.specificUnavailableDates === '-' &&
    display.availableTimeSlots === '-' &&
    !info?.specificUnavailableDateIsos?.length &&
    selectedTimeSlotLabels.length === 0 &&
    !interviewTimeRange
  ) {
    return undefined
  }

  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable: display.recurringUnavailable === '-' ? '' : display.recurringUnavailable,
    specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
    selectedTimeSlotLabels,
    interviewTimeRange,
    timeUnit: parseInterviewTimeUnitFromOverlay(overlay),
  })
}

export function isGeneralProgramVolunteerInterviewScheduleVisible(program: Program): boolean {
  return program.generalVolunteerInterviewEnabled !== false
}
