/**
 * 등록 위저드 모집/신청 양식.
 * 임시저장·복원은 localStorage, 등록 완료 시 form binding 준비만 remote를 사용한다.
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
import { createUjatProgramApplicationFormInstitutionDraft } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { createUjatProgramApplicationFormVolunteerDraft } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
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
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { resolveRegistrationProgramDraftProgramType } from '@/features/program/general/lib/resolve-program-api-type-for-draft'
import {
  getUjatApplicationInstitutionOverlayRecord,
  patchUjatApplicationInstitutionOverlay,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  getUjatApplicationVolunteerOverlayRecord,
  patchUjatApplicationVolunteerOverlay,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  getUjatRecruitInstitutionOverlayRecord,
  patchUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  patchUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'

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
  const programDraftType = resolveRegistrationProgramDraftProgramType(program)
  const programDraftId =
    peekRegistrationProgramDraftId(programDraftType) ??
    (await ensureRegistrationProgramDraftId(programDraftType))
  return loadDraftOwnedFormVersionRecord({ programDraftId, templateCode: catalogTemplateCode })
}

type OperationalOverlayKind =
  | 'institution-recruit'
  | 'general-recruit'
  | 'general-application'
  | 'ujat-recruit-institution'
  | 'ujat-recruit-volunteer'
  | 'ujat-application-institution'
  | 'ujat-application-volunteer'

function resolveOperationalOverlayKind(catalogTemplateId: string): OperationalOverlayKind | null {
  if (catalogTemplateId === 'recruitment-ujat-school') return 'ujat-recruit-institution'
  if (catalogTemplateId === 'recruitment-ujat-volunteer') return 'ujat-recruit-volunteer'
  if (catalogTemplateId === 'application-ujat-school') return 'ujat-application-institution'
  if (catalogTemplateId === 'application-ujat-volunteer') return 'ujat-application-volunteer'
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

export function createSeedDraftForOperationalCatalogId(
  catalogTemplateId: string
): WritingFormDraft | null {
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
    case 'recruitment-ujat-school':
      return createUjatRecruitFormInstitutionDraft()
    case 'recruitment-ujat-volunteer':
      return createUjatRecruitFormVolunteerDraft()
    case 'application-ujat-school':
      return createUjatProgramApplicationFormInstitutionDraft()
    case 'application-ujat-volunteer':
      return createUjatProgramApplicationFormVolunteerDraft()
    default:
      return null
  }
}

function overlayRecordForKind(kind: OperationalOverlayKind): Record<string, unknown> {
  if (kind === 'institution-recruit') return { ...getApplicantRecruitInstitutionOverlayRecord() }
  if (kind === 'general-recruit') return { ...getGeneralRecruitOverlayRecord() }
  if (kind === 'general-application') return { ...getGeneralApplicationOverlayRecord() }
  if (kind === 'ujat-recruit-institution') return { ...getUjatRecruitInstitutionOverlayRecord() }
  if (kind === 'ujat-recruit-volunteer') return { ...getUjatRecruitVolunteerOverlayRecord() }
  if (kind === 'ujat-application-institution') return { ...getUjatApplicationInstitutionOverlayRecord() }
  return { ...getUjatApplicationVolunteerOverlayRecord() }
}

export function collectOperationalOverlayForCatalogId(
  catalogTemplateId: string
): Record<string, unknown> | null {
  const kind = resolveOperationalOverlayKind(catalogTemplateId)
  if (kind == null) return null
  return overlayRecordForKind(kind)
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
  if (kind === 'general-application') {
    patchGeneralApplicationOverlay(overlay)
    return
  }
  if (kind === 'ujat-recruit-institution') {
    patchUjatRecruitInstitutionOverlay(overlay)
    return
  }
  if (kind === 'ujat-recruit-volunteer') {
    patchUjatRecruitVolunteerOverlay(overlay)
    return
  }
  if (kind === 'ujat-application-institution') {
    patchUjatApplicationInstitutionOverlay(overlay)
    return
  }
  patchUjatApplicationVolunteerOverlay(overlay)
}

/**
 * 「이어서 작성」 진입 시 — localStorage overlay를 공유 스토어에 병합 복원.
 */
export async function hydrateRegistrationOperationalOverlaysFromLocalDrafts(
  programType: string,
  variant: ProgramRegistrationFormVariant
): Promise<void> {
  const { loadRegistrationWizardFormDraft } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const saved = await loadRegistrationWizardFormDraft({
      programType,
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
 * 등록 완료 직전 — visible operational spec overlay를 draft-owned version에 PUT.
 * @deprecated `prepareRegistrationCreateFormBindings` 사용. 하위 호환용.
 */
export async function persistRegistrationOperationalOverlaySnapshots(
  program: Program
): Promise<void> {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const programDraftType = resolveRegistrationProgramDraftProgramType(program)
  const programDraftId = await ensureRegistrationProgramDraftId(programDraftType)
  for (const spec of listVisibleOperationalFormSpecs(program)) {
    const catalogId = spec.templateCode
    const overlay = collectOperationalOverlayForCatalogId(catalogId)
    if (overlay == null || Object.keys(overlay).length === 0) continue

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
      baseline: existing,
    })
  }
}

/** localStorage 삭제는 registration-wizard-form-draft에서 유형별로 일괄 처리한다. */
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
