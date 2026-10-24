import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { TRAINED_TEACHERS_REGISTRATION_ALL_VALUE } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import {
  peekGeneralRegistrationWizardRhf,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { overlayKeyToWizardUiPath } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  peekTrainedTeachersRegistrationRhf,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  isTrainedTeachersCommonInfoOverlayKey,
  readTrainedTeachersRhfOverlayValue,
  writeTrainedTeachersRhfOverlayValue,
} from '@/features/program/trained-teachers/lib/registration-rhf-values'
import {
  peekCompanySchoolRegistrationRhf,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isCompanySchoolCommonInfoOverlayKey,
  projectCompanySchoolRhfToOverlayRecord,
  readCompanySchoolRhfOverlayValue,
  writeCompanySchoolRhfOverlayValue,
} from '@/features/program/1c-1s/lib/registration-rhf-values'

/**
 * 일반·1사1교·교육받은 교사 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌
 * 로컬 state로만 관리될 때, 스텝 전환(언마운트)과 풀페이지·미리보기 이중 마운트에서
 * 입력값이 갈라지지 않도록 동일 키를 공유한다.
 */

/** 일반 등록 기본정보 — controlled editor state와 동기화하는 overlay 키 */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY =
  'generalRegistration.basicInfo.localSponsorId' as const
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY =
  'generalRegistration.basicInfo.localSponsorIds' as const
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY =
  'generalRegistration.basicInfo.localManagerContactId' as const
/** 후원사 담당자 ref 다중 선택 (`sponsorManagementId::contactId`) */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY =
  'generalRegistration.basicInfo.localManagerContactIds' as const
/** 후원사 담당자 표시 문구 (`직책 이름 | 연락처`) — create/상세 조회용 */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY =
  'generalRegistration.basicInfo.sponsorManagerLine' as const
export const GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY =
  'generalRegistration.basicInfo.localProgramTitleKo' as const
export const GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY =
  'generalRegistration.educationScheduleSettings.scheduleLines' as const
export const GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY =
  'generalRegistration.educationScheduleCurriculum.groupTimesByDetail' as const

const store = createScopedOverlayStore()

export function setProgramRegistrationOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function peekProgramRegistrationOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceProgramRegistrationOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetProgramRegistrationOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

function overlayState(): Record<string, unknown> {
  return store.getRecord()
}

function readOverlayString(key: string): string {
  const raw = overlayState()[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function readRhfSponsorIds(): string[] | null {
  const rhf = peekGeneralRegistrationWizardRhf()
  if (rhf == null) return null
  const values = rhf.getValues()
  if (Array.isArray(values.sponsorIds)) {
    const ids = values.sponsorIds.map(String).map(id => id.trim()).filter(Boolean)
    if (ids.length > 0) return ids
  }
  return typeof values.sponsorId === 'string' && values.sponsorId.trim()
    ? [values.sponsorId.trim()]
    : []
}

function readRhfSponsorContactIds(): string[] | null {
  const rhf = peekGeneralRegistrationWizardRhf()
  if (rhf == null) return null
  const values = rhf.getValues()
  if (Array.isArray(values.managerContactIds)) {
    const ids = [
      ...new Set(values.managerContactIds.map(String).map(id => id.trim()).filter(Boolean)),
    ]
    if (ids.length > 0) return ids
  }
  return typeof values.managerContactId === 'string' && values.managerContactId.trim()
    ? [values.managerContactId.trim()]
    : []
}

/** overlay에 남은 후원사 id (controlled state가 비었을 때 완료·복원 fallback) */
export function readGeneralRegistrationOverlaySponsorId(): string {
  const fromRhf = readRhfSponsorIds()
  if (fromRhf != null) return fromRhf[0] ?? ''
  return readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
}

export function readGeneralRegistrationOverlaySponsorIds(): string[] {
  const fromRhf = readRhfSponsorIds()
  if (fromRhf != null) return fromRhf
  const raw = overlayState()[GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]
  if (Array.isArray(raw)) {
    return raw
      .map(String)
      .map(id => id.trim())
      .filter(Boolean)
  }
  const primary = readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
  return primary ? [primary] : []
}

export function readGeneralRegistrationOverlaySponsorContactId(): string {
  const fromRhf = readRhfSponsorContactIds()
  if (fromRhf != null) return fromRhf[0] ?? ''
  const ids = readGeneralRegistrationOverlaySponsorContactIds()
  return ids[0] ?? readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
}

export function readGeneralRegistrationOverlaySponsorContactIds(): string[] {
  const fromRhf = readRhfSponsorContactIds()
  if (fromRhf != null) return fromRhf
  const raw = overlayState()[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw
          .map(String)
          .map(id => id.trim())
          .filter(Boolean)
      ),
    ]
  }
  const primary = readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
  return primary ? [primary] : []
}

/** 후원사·담당자 id/ref를 단일·다중 overlay 키에 함께 반영 (자동입력·에디터 동기화) */
export function patchGeneralRegistrationSponsorSelectionOverlay(args: {
  sponsorId: string
  contactSelectValue: string
}): void {
  const sponsorId = args.sponsorId.trim()
  const contactSelectValue = args.contactSelectValue.trim()
  patchProgramRegistrationOverlay({
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: sponsorId,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]: sponsorId ? [sponsorId] : [],
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: contactSelectValue,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]: contactSelectValue
      ? [contactSelectValue]
      : [],
  })
}

export function readGeneralRegistrationOverlayProgramTitleKo(): string {
  const rhf = peekGeneralRegistrationWizardRhf()
  if (rhf != null) {
    const fromRhf = rhf.getValues().programTitleKo
    return typeof fromRhf === 'string' ? fromRhf.trim() : ''
  }
  return readOverlayString(GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY)
}

const TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_ID_KEY =
  'trainedTeachersRegistration.basicInfo.sponsorId' as const
const TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY =
  'trainedTeachersRegistration.basicInfo.managerContactId' as const
const TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY =
  'trainedTeachersRegistration.basicInfo.managerContactIds' as const
const TRAINED_TEACHERS_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY =
  'trainedTeachersRegistration.basicInfo.programTitleKo' as const

export function readTrainedTeachersRegistrationOverlaySponsorId(): string {
  const rhf = peekTrainedTeachersRegistrationRhf()
  if (rhf != null) {
    return rhf.getValues().sponsorManagementIds[0] ?? ''
  }
  const raw = readOverlayString(TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
  return raw === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE ? '' : raw
}

export function readTrainedTeachersRegistrationOverlaySponsorContactId(): string {
  const ids = readTrainedTeachersRegistrationOverlaySponsorContactIds()
  if (ids[0]) return ids[0]
  const raw = readOverlayString(TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
  return raw === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE ? '' : raw
}

export function readTrainedTeachersRegistrationOverlaySponsorContactIds(): string[] {
  const rhf = peekTrainedTeachersRegistrationRhf()
  if (rhf != null) {
    return [...rhf.getValues().sponsorManagerContactIds]
  }
  const raw = overlayState()[TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw
          .map(String)
          .map(id => id.trim())
          .filter(id => id && id !== TRAINED_TEACHERS_REGISTRATION_ALL_VALUE)
      ),
    ]
  }
  const primary = readOverlayString(TRAINED_TEACHERS_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
  if (!primary || primary === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE) return []
  return [primary]
}

export function readTrainedTeachersRegistrationOverlayProgramTitleKo(): string {
  const rhf = peekTrainedTeachersRegistrationRhf()
  if (rhf != null) return rhf.getValues().mainTitle
  return readOverlayString(TRAINED_TEACHERS_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY)
}

const ECONOMY_REGISTRATION_OVERLAY_SPONSOR_ID_KEY =
  'economyRegistration.basicInfo.sponsorId' as const
export const ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY =
  'economyRegistration.basicInfo.repKo' as const
/** 1사1교 기본정보 국문 대표명 — 입력 전 overlay에 키가 없어도 화면에 보이는 기본값 */
export const ECONOMY_REGISTRATION_PROGRAM_TITLE_KO_DEFAULT: string = '1사1교 경제금융교육'
const ECONOMY_REGISTRATION_ALL_VALUE = '__all__'

export function readEconomyRegistrationOverlaySponsorId(): string {
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf != null) return rhf.getValues().sponsorId
  const raw = readOverlayString(ECONOMY_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
  return !raw || raw === ECONOMY_REGISTRATION_ALL_VALUE ? '' : raw
}

export function readRegistrationOverlaySponsorId(
  variant: ProgramRegistrationFormVariant = 'general'
): string {
  if (variant === 'trainedTeachers') {
    return readTrainedTeachersRegistrationOverlaySponsorId()
  }
  if (variant === 'economy') {
    return readEconomyRegistrationOverlaySponsorId()
  }
  return readGeneralRegistrationOverlaySponsorId()
}

export function readEconomyRegistrationOverlaySponsorContactIds(): string[] {
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf != null) return [...rhf.getValues().managerContactIds]
  const raw = overlayState()['economyRegistration.basicInfo.managerContactIds']
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw
          .map(String)
          .map(id => id.trim())
          .filter(id => id && id !== ECONOMY_REGISTRATION_ALL_VALUE)
      ),
    ]
  }
  const primary = readOverlayString('economyRegistration.basicInfo.managerContactId')
  if (!primary || primary === ECONOMY_REGISTRATION_ALL_VALUE) return []
  return [primary]
}

export function readRegistrationOverlaySponsorContactId(
  variant: ProgramRegistrationFormVariant = 'general'
): string {
  if (variant === 'trainedTeachers') {
    return readTrainedTeachersRegistrationOverlaySponsorContactId()
  }
  if (variant === 'economy') {
    return readEconomyRegistrationOverlaySponsorContactIds()[0] ?? ''
  }
  return readGeneralRegistrationOverlaySponsorContactId()
}

export function readRegistrationOverlaySponsorContactIds(
  variant: ProgramRegistrationFormVariant = 'general'
): string[] {
  if (variant === 'trainedTeachers') {
    return readTrainedTeachersRegistrationOverlaySponsorContactIds()
  }
  if (variant === 'economy') {
    return readEconomyRegistrationOverlaySponsorContactIds()
  }
  return readGeneralRegistrationOverlaySponsorContactIds()
}

export function readEconomyRegistrationOverlayProgramTitleKo(): string {
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf != null) return rhf.getValues().repKo
  const stored = overlayState()[ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]
  if (typeof stored === 'string') return stored
  if (typeof stored === 'number' && Number.isFinite(stored)) return String(stored)
  if (Object.prototype.hasOwnProperty.call(overlayState(), ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY)) {
    return ''
  }
  const visible = readOverlayKeyValue(
    ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
    ECONOMY_REGISTRATION_PROGRAM_TITLE_KO_DEFAULT
  )
  return typeof visible === 'string' && visible.trim() ? visible.trim() : ''
}

export function readRegistrationOverlayProgramTitleKo(
  variant: ProgramRegistrationFormVariant = 'general'
): string {
  if (variant === 'trainedTeachers') {
    return readTrainedTeachersRegistrationOverlayProgramTitleKo()
  }
  if (variant === 'economy') {
    return readEconomyRegistrationOverlayProgramTitleKo()
  }
  return readGeneralRegistrationOverlayProgramTitleKo()
}

/**
 * 입력 중 React state로 올리지 않기 위한 조회.
 * overlay에 키가 있으면 빈 문자열도 그 값을 쓰고, 없을 때만 fallback을 쓴다.
 */
export function readStoredRegistrationProgramTitleKo(
  variant: ProgramRegistrationFormVariant = 'general',
  fallback = ''
): string {
  if (variant === 'economy') return readEconomyRegistrationOverlayProgramTitleKo()
  if (variant === 'trainedTeachers' && peekTrainedTeachersRegistrationRhf() != null) {
    return peekTrainedTeachersRegistrationRhf()?.getValues().mainTitle.trim() || fallback.trim()
  }
  if (variant === 'general' && peekGeneralRegistrationWizardRhf() != null) {
    const fromRhf = peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo
    return typeof fromRhf === 'string' ? fromRhf.trim() : fallback.trim()
  }
  const key =
    variant === 'trainedTeachers'
      ? TRAINED_TEACHERS_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY
      : GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY
  if (!Object.prototype.hasOwnProperty.call(overlayState(), key)) return fallback.trim()
  return readRegistrationOverlayProgramTitleKo(variant)
}

/** controlled 제목 state → overlay 동기화 (임시저장 programTitleKo SSOT) */
export function patchRegistrationOverlayProgramTitleKo(
  variant: ProgramRegistrationFormVariant,
  title: string
): void {
  if (variant === 'economy') {
    // 1사1교 제목 SSOT는 `repKo`. 미사용 programTitleKo state로 덮지 않는다.
    return
  }
  if (variant === 'trainedTeachers') {
    const rhf = peekTrainedTeachersRegistrationRhf()
    if (rhf != null) {
      rhf.setPath('mainTitle', title, { shouldDirty: true })
      return
    }
    patchProgramRegistrationOverlay({
      [TRAINED_TEACHERS_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]: title,
    })
    return
  }
  patchProgramRegistrationOverlay({
    [GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]: title,
  })
}

/**
 * 세션 메타 `programTitleKo` 복원. TT 제목 정본은 canonical snapshot이므로
 * 레거시 메타로 RHF `mainTitle`을 덮지 않는다.
 */
export function hydrateRegistrationDraftProgramTitleKo(
  variant: ProgramRegistrationFormVariant,
  titleKo: string | undefined
): void {
  if (variant === 'trainedTeachers') return
  const trimmed = titleKo?.trim()
  if (!trimmed) return
  patchRegistrationOverlayProgramTitleKo(variant, trimmed)
}

export function readGeneralRegistrationOverlayScheduleLines(): string[] {
  const rhf = peekGeneralRegistrationWizardRhf()
  if (rhf != null) {
    const lines = rhf.getValues().scheduleLines
    if (Array.isArray(lines)) {
      return lines
        .filter((line): line is string => typeof line === 'string')
        .map(line => line.trim())
        .filter(Boolean)
    }
    return []
  }
  const raw = overlayState()[GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]
  if (!Array.isArray(raw)) return []
  return raw
    .filter((line): line is string => typeof line === 'string')
    .map(line => line.trim())
    .filter(Boolean)
}

export function subscribeProgramRegistrationOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function subscribeProgramRegistrationOverlayKey(
  key: string,
  listener: () => void
): () => void {
  return store.subscribeKey(key, listener)
}

/** 브리지·participant 스냅샷 등 — listed keys만 구독 (basicInfo 타이핑은 제외) */
export function subscribeProgramRegistrationOverlayKeys(
  keys: readonly string[],
  listener: () => void
): () => void {
  if (keys.length === 0) return () => {}
  const unsubs = keys.map(key => store.subscribeKey(key, listener))
  return () => {
    unsubs.forEach(unsub => unsub())
  }
}

export function getProgramRegistrationOverlayVersion(): number {
  return store.getVersion()
}

export function getProgramRegistrationOverlayRecord(): Record<string, unknown> {
  const stored = overlayState()
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf == null) return stored
  return { ...stored, ...projectCompanySchoolRhfToOverlayRecord(rhf.getValues()) }
}

/** 상세 수정 seed/복원용 — 등록 위저드 동작은 바꾸지 않는다. */
export function pickProgramRegistrationOverlayByPrefix(
  prefix: string,
  record: Record<string, unknown> = overlayState()
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key.startsWith(prefix)))
}

export function replaceProgramRegistrationOverlayPrefix(
  prefix: string,
  nextPrefixValues: Record<string, unknown>
): void {
  const kept = Object.fromEntries(
    Object.entries(overlayState()).filter(([key]) => !key.startsWith(prefix))
  )
  replaceProgramRegistrationOverlay({ ...kept, ...nextPrefixValues }, { shouldDirty: true })
}

/** 개발용 자동입력처럼 여러 관련 namespace를 한 번에 교체할 때 사용한다. */
export function replaceProgramRegistrationOverlayPrefixes(
  prefixes: readonly string[],
  nextValues: Record<string, unknown>
): void {
  const shouldReplace = (key: string) => prefixes.some(prefix => key.startsWith(prefix))
  const kept = Object.fromEntries(
    Object.entries(overlayState()).filter(([key]) => !shouldReplace(key))
  )
  replaceProgramRegistrationOverlay({ ...kept, ...nextValues }, { shouldDirty: true })
}

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  return readOperationalOverlayKvValue('program-registration', overlayState(), key, defaultValue)
}

/** RHF → overlay 일방향 projection 중이면 overlay 쓰기를 RHF로 되먹이지 않는다. */
let projectingFromWizardRhf = 0

export function beginRegistrationWizardRhfOverlayProjection(): void {
  projectingFromWizardRhf += 1
}

export function endRegistrationWizardRhfOverlayProjection(): void {
  projectingFromWizardRhf = Math.max(0, projectingFromWizardRhf - 1)
}

function syncWizardRhfFromOverlayPartial(
  partial: Record<string, unknown>,
  shouldDirty: boolean
): void {
  if (projectingFromWizardRhf > 0) return
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return
  for (const [key, value] of Object.entries(partial)) {
    const path = overlayKeyToWizardUiPath(key)
    if (path == null) continue
    api.setPath(path, value, { shouldDirty })
  }
}

function splitTrainedTeachersCommonInfoOverlay(
  record: Record<string, unknown>
): { commonInfo: Record<string, unknown>; rest: Record<string, unknown> } {
  const commonInfo: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isTrainedTeachersCommonInfoOverlayKey(key)) commonInfo[key] = value
    else rest[key] = value
  }
  return { commonInfo, rest }
}

function writeTrainedTeachersRhfOverlayPartial(partial: Record<string, unknown>): void {
  const api = peekTrainedTeachersRegistrationRhf()
  if (api == null) return
  const current = api.getValues()
  let next = current
  let changed = false
  for (const [key, value] of Object.entries(partial)) {
    const prev = readTrainedTeachersRhfOverlayValue(current, key)
    if (Object.is(prev, value)) continue
    next = writeTrainedTeachersRhfOverlayValue(next, key, value)
    changed = true
  }
  if (!changed || next === current) return
  api.reset(next, { keepDefaultValues: true })
}

function splitCompanySchoolCommonInfoOverlay(
  record: Record<string, unknown>
): { commonInfo: Record<string, unknown>; rest: Record<string, unknown> } {
  const commonInfo: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isCompanySchoolCommonInfoOverlayKey(key)) commonInfo[key] = value
    else rest[key] = value
  }
  return { commonInfo, rest }
}

function writeCompanySchoolRhfOverlayPartial(partial: Record<string, unknown>): void {
  const api = peekCompanySchoolRegistrationRhf()
  if (api == null) return
  const current = api.getValues()
  let next = current
  let changed = false
  for (const [key, value] of Object.entries(partial)) {
    const prev = readCompanySchoolRhfOverlayValue(current, key)
    if (Object.is(prev, value)) continue
    next = writeCompanySchoolRhfOverlayValue(next, key, value)
    changed = true
  }
  if (!changed || next === current) return
  api.reset(next, { keepDefaultValues: true })
}

export function patchProgramRegistrationOverlay(partial: Record<string, unknown>): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const { commonInfo, rest } = splitTrainedTeachersCommonInfoOverlay(partial)
    if (Object.keys(commonInfo).length > 0) writeTrainedTeachersRhfOverlayPartial(commonInfo)
    if (Object.keys(rest).length === 0) return
    syncWizardRhfFromOverlayPartial(rest, true)
    store.patch(rest)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const { commonInfo, rest } = splitCompanySchoolCommonInfoOverlay(partial)
    if (Object.keys(commonInfo).length > 0) writeCompanySchoolRhfOverlayPartial(commonInfo)
    if (Object.keys(rest).length === 0) return
    syncWizardRhfFromOverlayPartial(rest, true)
    store.patch(rest)
    return
  }
  syncWizardRhfFromOverlayPartial(partial, true)
  store.patch(partial)
}

export function updateProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const ttApi = peekTrainedTeachersRegistrationRhf()
  if (ttApi != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
    const prev = readTrainedTeachersRhfOverlayValue(ttApi.getValues(), key) as T | undefined
    const next = updater(prev)
    writeTrainedTeachersRhfOverlayPartial({ [key]: next })
    return
  }
  const csApi = peekCompanySchoolRegistrationRhf()
  if (csApi != null && isCompanySchoolCommonInfoOverlayKey(key)) {
    const prev = readCompanySchoolRhfOverlayValue(csApi.getValues(), key) as T | undefined
    const next = updater(prev)
    writeCompanySchoolRhfOverlayPartial({ [key]: next })
    return
  }
  const api = peekGeneralRegistrationWizardRhf()
  const path = overlayKeyToWizardUiPath(key)
  if (api != null && path != null && projectingFromWizardRhf === 0) {
    const prev = api.getPath(path) as T | undefined
    const next = updater(prev)
    api.setPath(path, next, { shouldDirty: true })
    projectingFromWizardRhf += 1
    try {
      store.updateKey(key, () => next)
    } finally {
      projectingFromWizardRhf -= 1
    }
    return
  }
  store.updateKey(key, updater)
}

export function replaceProgramRegistrationOverlay(
  next: Record<string, unknown>,
  options?: { shouldDirty?: boolean }
): void {
  const ttApi = peekTrainedTeachersRegistrationRhf()
  if (ttApi != null) {
    const { commonInfo, rest } = splitTrainedTeachersCommonInfoOverlay(next)
    if (Object.keys(commonInfo).length > 0) {
      ttApi.applyOverlayRecord(commonInfo, { shouldDirty: options?.shouldDirty ?? false })
    }
    if (projectingFromWizardRhf === 0) {
      peekGeneralRegistrationWizardRhf()?.applyOverlayRecord(rest, {
        shouldDirty: options?.shouldDirty ?? false,
      })
    }
    store.replace(rest)
    return
  }
  const csApi = peekCompanySchoolRegistrationRhf()
  if (csApi != null) {
    const { commonInfo, rest } = splitCompanySchoolCommonInfoOverlay(next)
    if (Object.keys(commonInfo).length > 0) {
      csApi.applyOverlayRecord(commonInfo, { shouldDirty: options?.shouldDirty ?? false })
    }
    if (projectingFromWizardRhf === 0) {
      peekGeneralRegistrationWizardRhf()?.applyOverlayRecord(rest, {
        shouldDirty: options?.shouldDirty ?? false,
      })
    }
    store.replace(rest)
    return
  }
  if (projectingFromWizardRhf === 0) {
    peekGeneralRegistrationWizardRhf()?.applyOverlayRecord(next, {
      shouldDirty: options?.shouldDirty ?? false,
    })
  }
  store.replace(next)
}

export function resetProgramRegistrationOverlay(): void {
  store.reset()
}

export function resetAllProgramRegistrationOverlay(): void {
  store.resetAll()
}

export function resetProgramRegistrationOverlayStoreForTests(): void {
  store.resetAll()
}

/**
 * `useSyncExternalStore`용 — 변경된 overlay 키만 구독한다.
 *
 * `defaultValue`는 `useRef`로 고정한다. 호출부가 `[]` / `{}` / 매 렌더 새 객체를
 * 넘기면 getSnapshot이 매번 다른 참조를 반환해 React가 store가 바뀐 것으로 오인하고
 * 리렌더 루프·형제 단락 입력 소실이 난다 (모집/신청 overlay의 defaultRef 패턴과 동일).
 */
export function useProgramRegistrationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const path = overlayKeyToWizardUiPath(key)
  const getSnapshot = useCallback(() => {
    const ttApi = peekTrainedTeachersRegistrationRhf()
    if (ttApi != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
      const raw = readTrainedTeachersRhfOverlayValue(ttApi.getValues(), key)
      return raw === undefined ? defaultRef.current : (raw as T)
    }
    const csApi = peekCompanySchoolRegistrationRhf()
    if (csApi != null && isCompanySchoolCommonInfoOverlayKey(key)) {
      const raw = readCompanySchoolRhfOverlayValue(csApi.getValues(), key)
      return raw === undefined ? defaultRef.current : (raw as T)
    }
    const api = peekGeneralRegistrationWizardRhf()
    if (api != null && path != null) {
      const raw = api.getPath(path)
      return raw === undefined ? defaultRef.current : (raw as T)
    }
    return readOverlayKeyValue(key, defaultRef.current)
  }, [key, path])

  const value = useSyncExternalStore(
    listener => {
      const unsubOverlay = subscribeProgramRegistrationOverlayKey(key, listener)
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
      const ttApi = peekTrainedTeachersRegistrationRhf()
      if (ttApi != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
        const prev = readTrainedTeachersRhfOverlayValue(ttApi.getValues(), key)
        if (Object.is(prev, next)) return
        writeTrainedTeachersRhfOverlayPartial({ [key]: next })
        return
      }
      const csApi = peekCompanySchoolRegistrationRhf()
      if (csApi != null && isCompanySchoolCommonInfoOverlayKey(key)) {
        const prev = readCompanySchoolRhfOverlayValue(csApi.getValues(), key)
        if (Object.is(prev, next)) return
        writeCompanySchoolRhfOverlayPartial({ [key]: next })
        return
      }
      const api = peekGeneralRegistrationWizardRhf()
      if (api != null && path != null) {
        const prev = api.getPath(path)
        if (Object.is(prev, next)) return
        api.setPath(path, next, { shouldDirty: true })
        projectingFromWizardRhf += 1
        try {
          store.patch({ [key]: next })
        } finally {
          projectingFromWizardRhf -= 1
        }
        return
      }
      const prev = getProgramRegistrationOverlayRecord()[key]
      if (Object.is(prev, next)) return
      patchProgramRegistrationOverlay({ [key]: next })
    },
    [key, path]
  )
  return [value, setValue]
}
