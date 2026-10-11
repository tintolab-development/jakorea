import { useCallback, useSyncExternalStore } from 'react'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

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
  finalAnnounceMethod: 'recruit.finalAnnounceMethod',
  targetLevels: 'recruit.targetLevels',
  targetLevelDetail: 'recruit.targetLevelDetail',
  inquiryContact: 'recruit.inquiryContact',
  inquiryTel: 'recruit.inquiryTel',
  inquiryEmail: 'recruit.inquiryEmail',
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
  finalAnnounceMethod?: string
  targetLevels?: string[]
  targetLevelDetail?: string
  inquiryContact?: string
  inquiryTel?: string
  inquiryEmail?: string
  notesNotApplicable?: boolean
  notes?: string
}

const store = createScopedOverlayStore({
  onRecordChange: record => syncOverlayLimitsToBridge(record),
})

export function setApplicantRecruitInstitutionOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function subscribeApplicantRecruitInstitutionOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function getApplicantRecruitInstitutionOverlayVersion(): number {
  return store.getVersion()
}

/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getApplicantRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekApplicantRecruitInstitutionOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceApplicantRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetApplicantRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

function readPreguidanceRequiredFromOverlay(
  record: Record<string, unknown>
): boolean | undefined {
  const raw = record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired]
  if (raw === 'need') return true
  if (raw === 'none') return false
  return undefined
}

function syncOverlayLimitsToBridge(record: Record<string, unknown>): void {
  const preEducationNoticeRequired = readPreguidanceRequiredFromOverlay(record)
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
    ...(preEducationNoticeRequired !== undefined
      ? { preEducationNoticeRequired }
      : {}),
  })
}

/** 등록 위저드 — 모집 탭을 열지 않았어도 스코프 overlay → 신청 폼 단락 노출 브리지 동기화 */
export function syncInstitutionApplicationBridgeFromApplicantRecruitOverlay(
  recruitTemplateCode: string | null | undefined,
  options?: {
    preEducationNoticeRequired?: boolean
    maxAssignableInstructors?: number
  }
): void {
  const record = peekApplicantRecruitInstitutionOverlayRecord(recruitTemplateCode)
  const fromOverlay = readPreguidanceRequiredFromOverlay(record)
  const preEducationNoticeRequired =
    options?.preEducationNoticeRequired ?? fromOverlay
  const maxAssignableInstructors =
    options?.maxAssignableInstructors ??
    (record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors] as
      | number
      | undefined)
  patchInstitutionApplicationProgramBridge({
    maxAssignableInstructors,
    maxClassCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount] as
      | number
      | undefined,
    maxScheduleCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount] as
      | number
      | undefined,
    maxSessionsPerDay: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay] as
      | number
      | undefined,
    ...(preEducationNoticeRequired !== undefined ? { preEducationNoticeRequired } : {}),
  })
}

export function patchApplicantRecruitInstitutionOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function replaceApplicantRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}

export function resetApplicantRecruitInstitutionOverlay(): void {
  store.reset()
}

export function resetAllApplicantRecruitInstitutionOverlay(): void {
  store.resetAll()
}

export function resetApplicantRecruitInstitutionOverlayStoreForTests(): void {
  store.resetAll()
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
  const value = readOperationalOverlayKvValue('institution-recruit', record, key, defaultValue)
  const setValue = useCallback(
    (next: T) => {
      patchApplicantRecruitInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
