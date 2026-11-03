import { useCallback, useRef, useSyncExternalStore } from 'react'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import {
  beginWizardRecruitmentRhfProjection,
  endWizardRecruitmentRhfProjection,
  isInstitutionRecruitOwnedKey,
  isWizardRecruitmentRhfProjecting,
  mergeWizardRecruitmentIntoOverlayRecord,
  patchWizardRecruitmentKv,
  peekGeneralRegistrationWizardRhf,
  readWizardRecruitmentKvValue,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'
import {
  patchActiveTrainedTeachersRecruitmentOverlay,
  peekActiveTrainedTeachersRecruitmentOverlayRecord,
  peekTrainedTeachersRegistrationRhf,
  readActiveTrainedTeachersRecruitmentOverlayValue,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  isTrainedTeachersRecruitmentCatalog,
  isTrainedTeachersRecruitmentOverlayKey,
} from '@/features/program/trained-teachers/lib/registration-rhf-recruitment'
import {
  patchActiveCompanySchoolRecruitmentOverlay,
  peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord,
  peekActiveCompanySchoolRecruitmentOverlayRecord,
  peekCompanySchoolRegistrationRhf,
  readActiveCompanySchoolRecruitmentOverlayValue,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isCompanySchoolRecruitmentCatalog,
  isCompanySchoolRecruitmentOverlayKey,
} from '@/features/program/1c-1s/lib/registration-rhf-recruitment'
import { splitCompanySchoolInstructorRecruitmentOverlay } from '@/features/program/1c-1s/lib/registration-rhf-instructor-recruitment'

import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from './applicant-recruit-institution-overlay-keys'

export { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS }

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

/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getApplicantRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekApplicantRecruitInstitutionOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  const csRecord =
    peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentCatalog(templateCode)
      ? peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord()
      : null
  const ttRecord =
    peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)
      ? peekActiveTrainedTeachersRecruitmentOverlayRecord()
      : null
  const merged = mergeWizardRecruitmentIntoOverlayRecord(
    store.peekRecord(templateCode),
    templateCode ?? 'recruitment-participant-school'
  )
  if (csRecord != null) return { ...merged, ...csRecord }
  return ttRecord != null ? { ...merged, ...ttRecord } : merged
}

export function replaceApplicantRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)) {
    patchActiveTrainedTeachersRecruitmentOverlay(next)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentCatalog(templateCode)) {
    patchActiveCompanySchoolRecruitmentOverlay(
      splitCompanySchoolInstructorRecruitmentOverlay(next).rest
    )
    const rhfRecord = peekActiveCompanySchoolRecruitmentOverlayRecord()
    if (rhfRecord) syncOverlayLimitsToBridge(rhfRecord)
    return
  }
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(next, { shouldDirty: false })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.replaceFor(templateCode, next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
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
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersRecruitmentOverlay(partial)
    if (Object.keys(rest).length === 0) return
    beginWizardRecruitmentRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolRecruitmentOverlay(partial)
    const rhfRecord = peekActiveCompanySchoolRecruitmentOverlayRecord()
    if (rhfRecord) syncOverlayLimitsToBridge(rhfRecord)
    if (Object.keys(rest).length === 0) return
    beginWizardRecruitmentRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(partial, { shouldDirty: true })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.patch(partial)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function replaceApplicantRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    patchActiveTrainedTeachersRecruitmentOverlay(next)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    patchActiveCompanySchoolRecruitmentOverlay(
      splitCompanySchoolInstructorRecruitmentOverlay(next).rest
    )
    const rhfRecord = peekActiveCompanySchoolRecruitmentOverlayRecord()
    if (rhfRecord) syncOverlayLimitsToBridge(rhfRecord)
    return
  }
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(next, { shouldDirty: false })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.replace(next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
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

export function useApplicantRecruitInstitutionOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const rhfOwned = isInstitutionRecruitOwnedKey(key)
  const getSnapshot = useCallback(() => {
    if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentOverlayKey(key)) {
      return readActiveTrainedTeachersRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentOverlayKey(key)) {
      return readActiveCompanySchoolRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (rhfOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardRecruitmentKvValue(key, defaultRef.current)
    }
    const record = getApplicantRecruitInstitutionOverlayRecord()
    return readOperationalOverlayKvValue('institution-recruit', record, key, defaultRef.current)
  }, [key, rhfOwned])

  const value = useSyncExternalStore(
    listener => {
      const unsubOverlay = subscribeApplicantRecruitInstitutionOverlay(listener)
      const unsubRhf = subscribeGeneralRegistrationWizardRhf(listener)
      const unsubTt = subscribeTrainedTeachersRegistrationRhf(listener)
      const unsubCs = subscribeCompanySchoolRegistrationRhf(listener)
      return () => {
        unsubOverlay()
        unsubRhf()
        unsubTt()
        unsubCs()
      }
    },
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      patchApplicantRecruitInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
