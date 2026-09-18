/**
 * 등록 위저드 모집/신청 양식 localStorage 초안 — 프로그램 유형(variant)별로 격리.
 * 「이어서 작성」이 아니면 해당 유형의 모집/신청 초안만 시드로 리셋한다.
 */

import { GENERAL_PROGRAM_REGISTRATION_STEPS } from '@/features/program/general/model/registration-flow'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
  removeWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getApplicantRecruitInstitutionOverlayRecord,
  patchApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { createEconomyRecruitFormInstitutionDraft } from '@/features/template/model/economy-recruit-form-institution-draft'
import { createProgramApplicationFormEconomyDraft } from '@/features/template/model/program-application-form-economy-draft'
import {
  createProgramParticipantApplicationDraft,
} from '@/features/template/model/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { createRecruitFormVolunteerDraft } from '@/features/template/model/recruit-form-volunteer-draft'
import { createTrainedTeachersRecruitFormInstitutionDraft } from '@/features/template/model/trained-teachers-recruit-form-institution-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'

/** 1사1교 전용 카탈로그 id (일반 모집/신청 id와 분리) */
const ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-economy',
  'application-economy',
] as const

/** 교육받은 교사 전용 카탈로그 id */
const TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-trained-teachers',
  'application-trained-teachers',
] as const

/**
 * 1사1교 위저드가 기관 외 탭에서 쓰는 공유 카탈로그 id.
 * 일반과 키가 겹치지 않도록 `reg-draft:economy:` 접두로 저장한다.
 */
const ECONOMY_SHARED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-participant-individual',
  'recruitment-instructor',
  'application-participant-individual',
  'application-instructor',
] as const

const REG_DRAFT_PREFIX = 'reg-draft:' as const

export function resolveRegistrationOperationalDraftStorageKey(
  variant: ProgramRegistrationFormVariant,
  templateId: string
): string {
  if (templateId.startsWith('registration-')) return templateId
  if (variant === 'general') return templateId
  if (variant === 'economy') {
    if ((ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
      return templateId
    }
    return `${REG_DRAFT_PREFIX}economy:${templateId}`
  }
  if (variant === 'trainedTeachers') {
    if (
      (TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS as readonly string[]).includes(templateId)
    ) {
      return templateId
    }
    return `${REG_DRAFT_PREFIX}trainedTeachers:${templateId}`
  }
  return templateId
}

export function listRegistrationOperationalFormDraftStorageKeys(
  variant: ProgramRegistrationFormVariant
): readonly string[] {
  if (variant === 'general') {
    return GENERAL_PROGRAM_REGISTRATION_STEPS.filter(s => s.phase !== 'program').map(
      s => s.templateId
    )
  }
  if (variant === 'economy') {
    return [
      ...ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS,
      ...ECONOMY_SHARED_OPERATIONAL_TEMPLATE_IDS.map(id =>
        resolveRegistrationOperationalDraftStorageKey('economy', id)
      ),
    ]
  }
  if (variant === 'trainedTeachers') {
    return [...TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS]
  }
  return []
}

/** storage key → 카탈로그 templateId (`reg-draft:economy:recruitment-instructor` → `recruitment-instructor`) */
export function catalogTemplateIdFromOperationalStorageKey(storageKey: string): string {
  if (storageKey.startsWith(`${REG_DRAFT_PREFIX}economy:`)) {
    return storageKey.slice(`${REG_DRAFT_PREFIX}economy:`.length)
  }
  if (storageKey.startsWith(`${REG_DRAFT_PREFIX}trainedTeachers:`)) {
    return storageKey.slice(`${REG_DRAFT_PREFIX}trainedTeachers:`.length)
  }
  return storageKey
}

type OperationalOverlayKind = 'institution-recruit' | 'general-recruit' | 'general-application'

function resolveOperationalOverlayKind(catalogTemplateId: string): OperationalOverlayKind | null {
  if (
    catalogTemplateId === 'recruitment-participant-school' ||
    catalogTemplateId === 'recruitment-economy' ||
    catalogTemplateId === 'recruitment-trained-teachers'
  ) {
    return 'institution-recruit'
  }
  if (catalogTemplateId.startsWith('recruitment-')) {
    return 'general-recruit'
  }
  if (catalogTemplateId.startsWith('application-')) {
    return 'general-application'
  }
  return null
}

function createSeedDraftForOperationalCatalogId(catalogTemplateId: string): WritingFormDraft | null {
  switch (catalogTemplateId) {
    case 'recruitment-participant-school':
      return createApplicantRecruitFormInstitutionDraft()
    case 'recruitment-economy':
      return createEconomyRecruitFormInstitutionDraft()
    case 'recruitment-trained-teachers':
      return createTrainedTeachersRecruitFormInstitutionDraft()
    case 'recruitment-participant-individual':
      return createApplicantRecruitFormIndividualDraft()
    case 'recruitment-instructor':
      return createRecruitFormInstructorDraft()
    case 'recruitment-volunteer':
      return createRecruitFormVolunteerDraft()
    case 'application-participant-school':
      return createProgramApplicationFormInstitutionDraft()
    case 'application-economy':
      return createProgramApplicationFormEconomyDraft()
    case 'application-trained-teachers':
      return createProgramApplicationFormTrainedTeachersDraft()
    case 'application-participant-individual':
      return createProgramParticipantApplicationDraft()
    case 'application-instructor':
      return createProgramApplicationFormInstructorDraft()
    case 'application-volunteer':
      return createProgramApplicationFormVolunteerDraft()
    default:
      return null
  }
}

function overlayRecordForKind(kind: OperationalOverlayKind): Record<string, unknown> {
  if (kind === 'institution-recruit') return { ...getApplicantRecruitInstitutionOverlayRecord() }
  if (kind === 'general-recruit') return { ...getGeneralRecruitOverlayRecord() }
  return { ...getGeneralApplicationOverlayRecord() }
}

function applyOverlayRecord(kind: OperationalOverlayKind, overlay: Record<string, unknown>): void {
  if (Object.keys(overlay).length === 0) return
  if (kind === 'institution-recruit') {
    patchApplicantRecruitInstitutionOverlay(overlay)
    return
  }
  if (kind === 'general-recruit') {
    patchGeneralRecruitOverlay(overlay)
    return
  }
  patchGeneralApplicationOverlay(overlay)
}

/**
 * 「이어서 작성」 진입 시 — 모집/신청 localStorage overlay를 공유 스토어에 병합 복원.
 * (탭을 열기 전에도 값이 보이게 하고, 탭별 부분 스냅샷이 서로를 지우지 않게 한다.)
 */
export function hydrateRegistrationOperationalOverlaysFromLocalDrafts(
  variant: ProgramRegistrationFormVariant
): void {
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    const saved = loadWritingFormTemplateSave(storageKey)
    const overlay = saved?.overlay
    if (overlay == null || Object.keys(overlay).length === 0) continue
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const kind = resolveOperationalOverlayKind(catalogId)
    if (kind == null) continue
    applyOverlayRecord(kind, overlay)
  }
}

/**
 * 임시저장 시 — 메모리상 모집/신청 overlay를 유형별 operational draft에 기록.
 * 현재 탭만이 아니라 공유 스토어 전체를 각 관련 template 키에 남겨, 이어서 작성 시 복원되게 한다.
 */
export function persistRegistrationOperationalOverlaySnapshots(
  variant: ProgramRegistrationFormVariant
): void {
  // TipTap「추가 내용」은 저장 직전에만 overlay로 flush
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const kind = resolveOperationalOverlayKind(catalogId)
    if (kind == null) continue
    const overlay = overlayRecordForKind(kind)
    if (Object.keys(overlay).length === 0) continue

    const existing = loadWritingFormTemplateSave(storageKey)
    const draft = existing?.draft ?? createSeedDraftForOperationalCatalogId(catalogId)
    if (draft == null) continue

    persistWritingFormTemplateSave({
      templateId: storageKey,
      draft,
      overlay,
      editorState: existing?.editorState,
    })
  }
}

/** 해당 유형 fresh 진입·등록 완료 시 — 그 유형의 모집/신청 임시저장본만 제거 */
export function clearRegistrationOperationalFormDrafts(
  variant: ProgramRegistrationFormVariant
): void {
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    removeWritingFormTemplateSave(storageKey)
  }
}

/** @deprecated `clearRegistrationOperationalFormDrafts('general')` 사용 */
export function clearGeneralProgramRegistrationOperationalFormDrafts(): void {
  clearRegistrationOperationalFormDrafts('general')
}

/** @deprecated `listRegistrationOperationalFormDraftStorageKeys('general')` 사용 */
export function listGeneralProgramRegistrationOperationalFormTemplateIds(): readonly string[] {
  return listRegistrationOperationalFormDraftStorageKeys('general')
}
