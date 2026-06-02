/**
 * 일반 프로그램 — 모집 양식 설정 → 참여자 신청(학교·기관) 폼 연동 브리지.
 * 템플릿 편집기·등록 마법사·상세 수정이 동일 스토어를 갱신한다.
 */

import { useSyncExternalStore } from 'react'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import type {
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
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
}

const DEFAULT_BRIDGE: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationScheduleMode: 'date',
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

export function patchInstitutionApplicationProgramBridge(
  partial: Partial<InstitutionApplicationProgramBridge>
): void {
  bridgeState = { ...bridgeState, ...partial }
  emit()
}

export function resetInstitutionApplicationProgramBridge(): void {
  bridgeState = { ...DEFAULT_BRIDGE }
  emit()
}

export function resolveInstitutionApplicationProgramBridge(
  program?: {
    generalProgramEducationStructure?: GeneralProgramEducationStructure
    generalProgramSessionRound?: GeneralProgramSessionRoundKind
    generalCommonInfo?: {
      participantRecruitmentInfo?: {
        preEducationNoticeRequired?: boolean
        maxAssignableInstructors?: number
        maxClassCount?: number
        maxScheduleCount?: number
        maxSessionsPerDay?: number
      }
      educationScheduleMode?: InstitutionApplicationEducationScheduleMode
    }
  } | null
): InstitutionApplicationProgramBridge {
  const info = program?.generalCommonInfo?.participantRecruitmentInfo
  return {
    preEducationNoticeRequired: info?.preEducationNoticeRequired ?? true,
    maxAssignableInstructors: info?.maxAssignableInstructors,
    maxClassCount: info?.maxClassCount,
    maxScheduleCount: info?.maxScheduleCount,
    maxSessionsPerDay: info?.maxSessionsPerDay,
    educationStructure: program?.generalProgramEducationStructure,
    sessionRound: program?.generalProgramSessionRound,
    educationScheduleMode: program?.generalCommonInfo?.educationScheduleMode ?? 'date',
  }
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
  return (
    shouldShowInstitutionApplicationMaxScheduleFields(bridge) ||
    shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)
  )
}

export function getInstitutionApplicationFormHiddenParagraphIds(
  bridge: InstitutionApplicationProgramBridge
): ReadonlySet<string> | undefined {
  if (shouldShowInstitutionApplicationGuidanceParagraph(bridge)) {
    return undefined
  }
  return new Set([PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance])
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
