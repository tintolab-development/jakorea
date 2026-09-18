/**
 * 일반 프로그램 — 모집 양식 설정 → 참여자 신청(학교·기관) 폼 연동 브리지.
 * 템플릿 편집기·등록 마법사·상세 수정이 동일 스토어를 갱신한다.
 */

import { useSyncExternalStore } from 'react'
import dayjs from 'dayjs'
import { shouldShowInstitutionApplicationEducationFormatField } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph } from '@/features/program/general/lib/institution-application-form-visibility'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import {
  countUniqueEducationScheduleCalendarDays,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { resolveProgramParticipantMaxClassCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import type {
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
  Program,
} from '@/types/domain'

export type InstitutionApplicationEducationScheduleMode = 'date' | 'period'

export type InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: boolean | null
  maxAssignableInstructors?: number
  maxClassCount?: number
  maxScheduleCount?: number
  maxSessionsPerDay?: number
  educationStructure?: GeneralProgramEducationStructure
  sessionRound?: GeneralProgramSessionRoundKind
  /** `period` = 등록·공통정보 「기간 지정」(기획: 날짜 선택(기간)) */
  educationScheduleMode?: InstitutionApplicationEducationScheduleMode
  /** 날짜 지정 등 — 신청 폼 고정 일정 선택지 (프로그램 등록 교육 진행 예정일) */
  educationScheduleLines?: readonly string[]
  /** 기간 지정 — 신청 폼 희망 교육일 선택 가능 범위 */
  educationScheduleRange?: { start: string; end: string }
  /**
   * 등록 폼 교육 형태가 「참여자 선택」일 때 신청 폼 「희망 교육 형태」 노출.
   * 등록 위저드·상세 resolve 모두 동일 플래그를 쓴다.
   */
  showPreferredEducationForm?: boolean
}

const DEFAULT_BRIDGE: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationScheduleMode: 'date',
  showPreferredEducationForm: false,
}

let bridgeState: InstitutionApplicationProgramBridge = { ...DEFAULT_BRIDGE }
let bridgeVersion = 0
const listeners = new Set<() => void>()

function emit() {
  bridgeVersion += 1
  listeners.forEach(l => l())
}

export function subscribeInstitutionApplicationProgramBridge(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstitutionApplicationProgramBridgeVersion(): number {
  return bridgeVersion
}

export function getInstitutionApplicationProgramBridge(): InstitutionApplicationProgramBridge {
  return bridgeState
}

function educationScheduleLinesEqual(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined
): boolean {
  if (a === b) return true
  if (a == null || b == null) return a == null && b == null
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function educationScheduleRangeEqual(
  a: InstitutionApplicationProgramBridge['educationScheduleRange'],
  b: InstitutionApplicationProgramBridge['educationScheduleRange']
): boolean {
  if (a === b) return true
  if (a == null || b == null) return a == null && b == null
  return a.start === b.start && a.end === b.end
}

function bridgePartialEqualsCurrent(
  partial: Partial<InstitutionApplicationProgramBridge>
): boolean {
  for (const key of Object.keys(partial) as Array<keyof InstitutionApplicationProgramBridge>) {
    const next = partial[key]
    const prev = bridgeState[key]
    if (key === 'educationScheduleLines') {
      if (
        !educationScheduleLinesEqual(
          prev as readonly string[] | undefined,
          next as readonly string[] | undefined
        )
      ) {
        return false
      }
      continue
    }
    if (key === 'educationScheduleRange') {
      if (
        !educationScheduleRangeEqual(
          prev as InstitutionApplicationProgramBridge['educationScheduleRange'],
          next as InstitutionApplicationProgramBridge['educationScheduleRange']
        )
      ) {
        return false
      }
      continue
    }
    if (!Object.is(prev, next)) return false
  }
  return true
}

export function patchInstitutionApplicationProgramBridge(
  partial: Partial<InstitutionApplicationProgramBridge>
): void {
  // 동일 값 재patch → emit 생략 (등록 폼 effect ↔ useSyncExternalStore 무한 루프 방지)
  if (bridgePartialEqualsCurrent(partial)) return
  bridgeState = { ...bridgeState, ...partial }
  bridgeIsDefault = false
  emit()
}

let bridgeIsDefault = true

export function resetInstitutionApplicationProgramBridge(): void {
  // 이미 기본값이면 emit 생략 — 닫힌 모달 effect + 불안정 program 참조 루프 방지
  if (bridgeIsDefault) return
  bridgeState = { ...DEFAULT_BRIDGE }
  bridgeIsDefault = true
  emit()
}

export function resolveInstitutionApplicationProgramBridge(
  program?: Program | null
): InstitutionApplicationProgramBridge {
  const commonInfo = program ? resolveGeneralProgramCommonInfo(program) : undefined
  const info = commonInfo?.participantRecruitmentInfo
  const educationScheduleMode = commonInfo?.educationScheduleMode ?? 'date'
  const educationScheduleLines = commonInfo?.educationScheduleLines
  return {
    preEducationNoticeRequired: info?.preEducationNoticeRequired ?? true,
    maxAssignableInstructors: info?.maxAssignableInstructors,
    maxClassCount: resolveProgramParticipantMaxClassCount(program),
    maxScheduleCount: info?.maxScheduleCount,
    maxSessionsPerDay: info?.maxSessionsPerDay,
    educationStructure: program?.generalProgramEducationStructure,
    sessionRound: program?.generalProgramSessionRound,
    educationScheduleMode,
    educationScheduleLines,
    educationScheduleRange: resolveEducationScheduleRangeForBridge(
      program,
      commonInfo?.educationScheduleRange,
      educationScheduleMode,
      educationScheduleLines
    ),
    showPreferredEducationForm: shouldShowInstitutionApplicationEducationFormatField(program),
  }
}

function isIsoScheduleRange(
  value: { start?: string; end?: string } | null | undefined
): value is { start: string; end: string } {
  if (value == null || typeof value.start !== 'string' || typeof value.end !== 'string') {
    return false
  }
  const start = dayjs(value.start)
  const end = dayjs(value.end)
  return start.isValid() && end.isValid()
}

/**
 * 신청 캘린더 disabledDate 범위.
 * 1) config/commonInfo `educationScheduleRange` 우선
 * 2) 없으면 program 사업 운영 기간(startDate/endDate)
 * 3) 기간 지정·등록 위저드 live: lines 파싱 (저장된 range 없을 때만)
 */
function resolveEducationScheduleRangeForBridge(
  program: Program | null | undefined,
  storedRange: { start?: string; end?: string } | null | undefined,
  educationScheduleMode: InstitutionApplicationEducationScheduleMode,
  educationScheduleLines: readonly string[] | undefined
): { start: string; end: string } | undefined {
  if (isIsoScheduleRange(storedRange)) {
    return {
      start: dayjs(storedRange.start).startOf('day').toISOString(),
      end: dayjs(storedRange.end).endOf('day').toISOString(),
    }
  }

  if (program?.startDate != null && program?.endDate != null) {
    const start = dayjs(program.startDate as string | Date)
    const end = dayjs(program.endDate as string | Date)
    if (start.isValid() && end.isValid()) {
      return {
        start: start.startOf('day').toISOString(),
        end: end.endOf('day').toISOString(),
      }
    }
  }

  if (educationScheduleMode === 'period' && educationScheduleLines?.length) {
    for (let i = educationScheduleLines.length - 1; i >= 0; i -= 1) {
      const range = parseEducationScheduleLineToRange(educationScheduleLines[i])
      if (!range) continue
      const [start, end] = range
      if (!start.isSame(end, 'day')) {
        return {
          start: start.startOf('day').toISOString(),
          end: end.endOf('day').toISOString(),
        }
      }
    }
  }

  return undefined
}

/** 신청 폼 「희망 교육 형태」 — 등록 교육 형태가 「참여자 선택」일 때만 */
export function shouldShowInstitutionApplicationPreferredEducationForm(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return bridge.showPreferredEducationForm === true
}

/** 사전 안내 「필요」일 때만 안내 사항 단락 노출 */
export function shouldShowInstitutionApplicationGuidanceParagraph(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return bridge.preEducationNoticeRequired !== false
}

function isDatePeriodSelection(bridge: InstitutionApplicationProgramBridge): boolean {
  return bridge.educationScheduleMode === 'period'
}

/**
 * 템플릿 관리(유형·회차 미연동) 편집 컨텍스트.
 * 등록 위저드·프로그램 상세에서는 educationStructure/sessionRound가 채워진다.
 */
export function isInstitutionApplicationBridgeTemplateAuthoring(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return bridge.educationStructure == null && bridge.sessionRound == null
}

/** 희망 일정 신청 — 최대 일정 수 필드(및 일정 UI) 노출 */
export function shouldShowInstitutionApplicationMaxScheduleFields(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  if (!isDatePeriodSelection(bridge)) return false
  const structure = bridge.educationStructure
  const round = bridge.sessionRound
  if (structure === 'curriculum' && (round === 'single' || round === 'multi')) return true
  if (structure === 'schedule' && round === 'single') return true
  return false
}

/** 희망 차시 — 일정당 최대 차시 (커리큘럼형 + 복수 회차 + 기간 지정) */
export function shouldShowInstitutionApplicationMaxSessionsPerDayField(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return (
    bridge.educationStructure === 'curriculum' &&
    bridge.sessionRound === 'multi' &&
    isDatePeriodSelection(bridge)
  )
}

export function shouldShowInstitutionApplicationPreferredScheduleParagraph(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
    return false
  }
  return (
    shouldShowInstitutionApplicationMaxScheduleFields(bridge) ||
    shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)
  )
}

/** 진행 희망 교육 일정 단락 카드 노출 — 일정형 + 복수 회차, 날짜 지정 고유 일자 ≤1일 숨김 */
export function shouldShowInstitutionApplicationScheduleParagraph(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  if (bridge.educationStructure === 'schedule' && bridge.sessionRound === 'multi') {
    return false
  }
  if (bridge.educationScheduleMode !== 'period') {
    return countUniqueEducationScheduleCalendarDays(bridge.educationScheduleLines) > 1
  }
  return true
}

export function getInstitutionApplicationFormHiddenParagraphIds(
  bridge: InstitutionApplicationProgramBridge
): ReadonlySet<string> | undefined {
  const hidden = new Set<string>()
  if (!shouldShowInstitutionApplicationGuidanceParagraph(bridge)) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)
  }
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)
  }
  if (!shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod)
  }
  return hidden.size > 0 ? hidden : undefined
}

export function useInstitutionApplicationProgramBridge(): InstitutionApplicationProgramBridge {
  const version = useSyncExternalStore(
    subscribeInstitutionApplicationProgramBridge,
    getInstitutionApplicationProgramBridgeVersion,
    getInstitutionApplicationProgramBridgeVersion
  )
  void version
  return getInstitutionApplicationProgramBridge()
}
