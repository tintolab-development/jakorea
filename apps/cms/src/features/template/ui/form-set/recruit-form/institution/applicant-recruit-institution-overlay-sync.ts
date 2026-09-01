import { useCallback, useSyncExternalStore } from 'react'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'

export const APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS = {
  maxAssignableInstructors: 'recruit.maxAssignableInstructors',
  maxClassCount: 'recruit.maxClassCount',
  maxScheduleCount: 'recruit.maxScheduleCount',
  maxSessionsPerDay: 'recruit.maxSessionsPerDay',
  announcementPublished: 'recruit.announcementPublished',
  preguidanceRequired: 'recruit.preguidanceRequired',
  studentListRequired: 'recruit.studentListRequired',
  certificateProvided: 'recruit.certificateProvided',
  programAnchorIso: 'recruit.programAnchorIso',
  programRangeSeal: 'recruit.programRangeSeal',
  recruitAnchorIso: 'recruit.recruitAnchorIso',
  recruitRangeSeal: 'recruit.recruitRangeSeal',
  finalAnnounceIso: 'recruit.finalAnnounceIso',
  targetLevels: 'recruit.targetLevels',
  notesNotApplicable: 'recruit.notesNotApplicable',
  notes: 'recruit.notes',
} as const

export type ApplicantRecruitInstitutionLimitsOverlay = {
  maxAssignableInstructors?: number
  maxClassCount?: number
  maxScheduleCount?: number
  maxSessionsPerDay?: number
}

export type ApplicantRecruitInstitutionOverlay = ApplicantRecruitInstitutionLimitsOverlay & {
  announcementPublished?: string
  preguidanceRequired?: string
  studentListRequired?: string
  certificateProvided?: string
  programAnchorIso?: string | null
  programRangeSeal?: { start: string; end: string } | null
  recruitAnchorIso?: string | null
  recruitRangeSeal?: { start: string; end: string } | null
  finalAnnounceIso?: string | null
  targetLevels?: string[]
  notesNotApplicable?: boolean
  notes?: string
}

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeApplicantRecruitInstitutionOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getApplicantRecruitInstitutionOverlayVersion(): number {
  return overlayVersion
}

export function getApplicantRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return overlayState
}

function syncOverlayLimitsToBridge(record: Record<string, unknown>): void {
  patchInstitutionApplicationProgramBridge({
    maxAssignableInstructors: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors] as
      | number
      | undefined,
    maxClassCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount] as number | undefined,
    maxScheduleCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount] as
      | number
      | undefined,
    maxSessionsPerDay: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay] as
      | number
      | undefined,
  })
}

export function patchApplicantRecruitInstitutionOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  syncOverlayLimitsToBridge(overlayState)
  emitOverlay()
}

export function replaceApplicantRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  syncOverlayLimitsToBridge(overlayState)
  emitOverlay()
}

export function resetApplicantRecruitInstitutionOverlay(): void {
  overlayState = {}
  emitOverlay()
}

export function getApplicantRecruitInstitutionLimitsFromOverlay(): ApplicantRecruitInstitutionLimitsOverlay {
  const record = getApplicantRecruitInstitutionOverlayRecord()
  return {
    maxAssignableInstructors: record[
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors
    ] as number | undefined,
    maxClassCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount] as
      | number
      | undefined,
    maxScheduleCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount] as
      | number
      | undefined,
    maxSessionsPerDay: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay] as
      | number
      | undefined,
  }
}

export function useApplicantRecruitInstitutionOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeApplicantRecruitInstitutionOverlay,
    getApplicantRecruitInstitutionOverlayVersion,
    getApplicantRecruitInstitutionOverlayVersion
  )
  void version
  const record = getApplicantRecruitInstitutionOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchApplicantRecruitInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
