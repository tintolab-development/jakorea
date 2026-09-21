/**
 * 등록 위저드 모집/신청 양식 — draft-owned form version SSOT (program-draft 세션).
 */

import { GENERAL_PROGRAM_REGISTRATION_STEPS } from '@/features/program/general/model/registration-flow'
import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
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
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { createRecruitFormVolunteerDraft } from '@/features/template/model/recruit-form-volunteer-draft'
import { createTrainedTeachersRecruitFormInstitutionDraft } from '@/features/template/model/trained-teachers-recruit-form-institution-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import type { Program } from '@/types/domain'
import {
  resolveProgramOperationalBindingKind,
  type ProgramOperationalBindingKind,
} from '@/features/program/general/lib/program-operational-binding-profile'
import {
  ensureRegistrationProgramDraftId,
  peekRegistrationProgramDraftId,
} from '@/features/program/general/lib/registration-program-draft-session'
import {
  loadDraftOwnedFormVersionRecord,
  persistDraftOwnedFormVersion,
} from '@/features/program/general/lib/registration-draft-form-versions'
import { resolveProgramApiTypeForDraft } from '@/features/program/general/lib/resolve-program-api-type-for-draft'

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

const REG_DRAFT_PREFIX = 'reg-draft:' as const

export function resolveRegistrationOperationalDraftStorageKey(
  _variant: ProgramRegistrationFormVariant,
  templateId: string
): string {
  if (templateId.startsWith('registration-')) return templateId
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
      'recruitment-participant-individual',
      'recruitment-instructor',
      'application-participant-individual',
      'application-instructor',
    ]
  }
  if (variant === 'trainedTeachers') {
    return [...TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS]
  }
  return []
}

/** storage key → 카탈로그 templateId */
export function catalogTemplateIdFromOperationalStorageKey(storageKey: string): string {
  if (storageKey.startsWith(`${REG_DRAFT_PREFIX}economy:`)) {
    return storageKey.slice(`${REG_DRAFT_PREFIX}economy:`.length)
  }
  if (storageKey.startsWith(`${REG_DRAFT_PREFIX}trainedTeachers:`)) {
    return storageKey.slice(`${REG_DRAFT_PREFIX}trainedTeachers:`.length)
  }
  return storageKey
}

function registrationVariantForBindingKind(
  kind: ProgramOperationalBindingKind
): ProgramRegistrationFormVariant | null {
  if (kind === 'COMPANY_SCHOOL') return 'economy'
  if (kind === 'TRAINED_TEACHER') return 'trainedTeachers'
  return null
}

/** attach 시 draft-owned version lookup — catalog templateCode 그대로 */
export function resolveOperationalDraftStorageKey(
  program: Program,
  catalogTemplateCode: string
): string {
  const kind = resolveProgramOperationalBindingKind(program)
  const variant = registrationVariantForBindingKind(kind)
  if (variant == null) return catalogTemplateCode
  return resolveRegistrationOperationalDraftStorageKey(variant, catalogTemplateCode)
}

export async function loadOperationalFormDraftForProgram(
  program: Program,
  catalogTemplateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  const programType = resolveProgramApiTypeForDraft(program)
  const programDraftId =
    peekRegistrationProgramDraftId(programType) ??
    (await ensureRegistrationProgramDraftId(programType))
  return loadDraftOwnedFormVersionRecord({ programDraftId, templateCode: catalogTemplateCode })
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
 * 「이어서 작성」 진입 시 — draft-owned version overlay를 공유 스토어에 병합 복원.
 */
export async function hydrateRegistrationOperationalOverlaysFromLocalDrafts(
  programType: string,
  variant: ProgramRegistrationFormVariant
): Promise<void> {
  const programDraftId = await ensureRegistrationProgramDraftId(programType)
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const saved = await loadDraftOwnedFormVersionRecord({
      programDraftId,
      templateCode: catalogId,
    })
    const overlay = saved?.overlay
    if (overlay == null || Object.keys(overlay).length === 0) continue
    const kind = resolveOperationalOverlayKind(catalogId)
    if (kind == null) continue
    applyOverlayRecord(kind, overlay)
  }
}

/**
 * 임시저장 시 — 메모리상 모집/신청 overlay를 draft-owned version에 PUT.
 */
export async function persistRegistrationOperationalOverlaySnapshots(
  programType: string,
  variant: ProgramRegistrationFormVariant
): Promise<void> {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const programDraftId = await ensureRegistrationProgramDraftId(programType)
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const kind = resolveOperationalOverlayKind(catalogId)
    if (kind == null) continue
    const overlay = overlayRecordForKind(kind)
    if (Object.keys(overlay).length === 0) continue

    const existing = await loadDraftOwnedFormVersionRecord({
      programDraftId,
      templateCode: catalogId,
    })
    const draft = existing?.draft ?? createSeedDraftForOperationalCatalogId(catalogId)
    if (draft == null) continue

    await persistDraftOwnedFormVersion({
      programDraftId,
      templateCode: catalogId,
      draft,
      overlay,
      editorState: existing?.editorState,
    })
  }
}

/** fresh 진입·등록 완료 시 — program-draft DELETE가 form version session도 정리 */
export function clearRegistrationOperationalFormDrafts(
  _variant: ProgramRegistrationFormVariant
): void {
  // no-op — draft-owned versions는 program-draft DELETE/clearRegistrationProgramDraftSession에서 정리
}

/** @deprecated `clearRegistrationOperationalFormDrafts('general')` 사용 */
export function clearGeneralProgramRegistrationOperationalFormDrafts(): void {
  clearRegistrationOperationalFormDrafts('general')
}

/** @deprecated `listRegistrationOperationalFormDraftStorageKeys('general')` 사용 */
export function listGeneralProgramRegistrationOperationalFormTemplateIds(): readonly string[] {
  return listRegistrationOperationalFormDraftStorageKeys('general')
}
