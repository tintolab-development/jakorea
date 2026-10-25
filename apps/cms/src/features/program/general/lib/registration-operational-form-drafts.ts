/**
 * 등록 위저드 모집/신청 양식.
 * 임시저장·복원은 localStorage, 등록 완료 시 form binding 준비만 remote를 사용한다.
 */

import { GENERAL_PROGRAM_REGISTRATION_STEPS } from '@/features/program/general/model/registration-flow'
import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import {
  peekGeneralApplicationOverlayRecord,
  replaceGeneralApplicationOverlayForScope,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  peekApplicantRecruitInstitutionOverlayRecord,
  replaceApplicantRecruitInstitutionOverlayForScope,
  resetApplicantRecruitInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  mergeRecruitDetailInfoFromGeneralStore,
  pickUjatVolunteerRecruitGeneralStoreSidecar,
  recruitDetailInfoOverlayPrefixForCatalogId,
  replaceRecruitDetailInfoIntoGeneralStore,
  replaceUjatVolunteerRecruitGeneralStoreSidecar,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
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
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { getRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'
import { resolveRegistrationProgramDraftProgramType } from '@/features/program/general/lib/resolve-program-api-type-for-draft'
import {
  peekUjatApplicationInstitutionOverlayRecord,
  replaceUjatApplicationInstitutionOverlayForScope,
  resetUjatApplicationInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  peekUjatApplicationVolunteerOverlayRecord,
  replaceUjatApplicationVolunteerOverlayForScope,
  resetUjatApplicationVolunteerOverlayForScope,
  stripUjatApplicationVolunteerProgramOnlyFields,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  peekUjatRecruitInstitutionOverlayRecord,
  replaceUjatRecruitInstitutionOverlayForScope,
  resetUjatRecruitInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  peekUjatRecruitVolunteerOverlayRecord,
  replaceUjatRecruitVolunteerOverlayForScope,
  resetUjatRecruitVolunteerOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { createGeminiVisitingTrainingRecruitFormDraft } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import {
  peekGeminiRecruitOverlayRecord,
  replaceGeminiRecruitOverlayForScope,
  resetGeminiRecruitOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'
import { suppressOperationalSeedDefaults } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import {
  peekProgramRegistrationOverlayRecord,
  replaceProgramRegistrationOverlayForScope,
  resetProgramRegistrationOverlayForScope,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

/** 등록 위저드 모집/신청 임시저장 목록 — UJAT는 일반과 동일하게 전 탭 overlay를 남긴다. */
export type RegistrationOperationalDraftVariant = ProgramRegistrationFormVariant | 'ujat'

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

/** UJAT 모집/신청 카탈로그 id (상·하반기 봉사자는 동일 템플릿) */
const UJAT_OWNED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-ujat-school',
  'recruitment-ujat-volunteer',
  'application-ujat-school',
  'application-ujat-volunteer',
] as const

const REG_DRAFT_PREFIX = 'reg-draft:' as const

export function resolveRegistrationOperationalDraftStorageKey(
  _variant: RegistrationOperationalDraftVariant,
  templateId: string
): string {
  if (templateId.startsWith('registration-')) return templateId
  return templateId
}

export function listRegistrationOperationalFormDraftStorageKeys(
  variant: RegistrationOperationalDraftVariant,
  programType?: string
): readonly string[] {
  const defaults =
    variant === 'general'
      ? GENERAL_PROGRAM_REGISTRATION_STEPS.filter(s => s.phase !== 'program').map(s => s.templateId)
      : variant === 'economy'
        ? [
            ...ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS,
            'recruitment-participant-individual',
            'recruitment-instructor',
            'application-participant-individual',
            'application-instructor',
          ]
        : variant === 'trainedTeachers'
          ? [...TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS]
          : variant === 'ujat'
            ? [...UJAT_OWNED_OPERATIONAL_TEMPLATE_IDS]
            : []
  if (programType == null) return defaults
  return [...new Set([...defaults, ...Object.values(getRegistrationStepTemplateSelections(programType))])]
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

/** 상세·CREATE 후 양식 적용 — 등록 위저드 localStorage 초안만 읽는다(서버 임시저장 없음). */
export async function loadOperationalFormDraftForProgram(
  program: Program,
  catalogTemplateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  const programDraftType = resolveRegistrationProgramDraftProgramType(program)
  const { loadRegistrationWizardFormDraft } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  return loadRegistrationWizardFormDraft({
    programType: programDraftType,
    templateCode: catalogTemplateCode,
  })
}

type OperationalOverlayKind =
  | 'institution-recruit'
  | 'general-recruit'
  | 'gemini-recruit'
  | 'general-application'
  | 'ujat-recruit-institution'
  | 'ujat-recruit-volunteer'
  | 'ujat-application-institution'
  | 'ujat-application-volunteer'
  | 'program-registration'

function resolveOperationalCatalogId(templateCode: string): string {
  return resolveWritingFormBaseTemplateCode(
    templateCode,
    getFormTemplateVersionCacheEntry(templateCode)?.baseTemplateCode
  )
}

function resolveOperationalOverlayKind(catalogTemplateId: string): OperationalOverlayKind | null {
  const code = resolveOperationalCatalogId(catalogTemplateId)
  if (code === 'recruitment-ujat-school') return 'ujat-recruit-institution'
  if (code === 'recruitment-ujat-volunteer') return 'ujat-recruit-volunteer'
  if (code === 'recruitment-gemini-visiting-training') return 'gemini-recruit'
  if (code === 'application-ujat-school') return 'ujat-application-institution'
  if (code === 'application-ujat-volunteer') return 'ujat-application-volunteer'
  if (
    code === 'recruitment-participant-school' ||
    code === 'recruitment-economy' ||
    code === 'recruitment-trained-teachers'
  ) {
    return 'institution-recruit'
  }
  if (code.startsWith('recruitment-')) {
    return 'general-recruit'
  }
  if (code.startsWith('application-')) {
    return 'general-application'
  }
  if (code.startsWith('registration-')) return 'program-registration'
  return null
}

/** 공유 스토어에서 이 카탈로그 탭만 지울 때 쓰는 키 prefix */
export function operationalOverlayKeyPrefixesForCatalogId(
  catalogTemplateId: string
): readonly string[] {
  const code = resolveOperationalCatalogId(catalogTemplateId)
  switch (code) {
    case 'recruitment-participant-school':
      return ['recruit.detailInfo']
    case 'recruitment-economy':
      return ['economyRecruit.detailInfo']
    case 'recruitment-trained-teachers':
      return ['trainedTeachersRecruit.detailInfo']
    case 'recruitment-participant-individual':
      return ['recruit.individual', 'recruit.detailInfo']
    case 'recruitment-instructor':
      return ['recruit.instructor', 'recruitInstructor.detailInfo']
    case 'recruitment-volunteer':
      return ['recruit.volunteer', 'recruitVolunteer']
    case 'recruitment-gemini-visiting-training':
      return ['geminiRecruit']
    case 'recruitment-ujat-school':
      return ['ujatRecruit.detailInfo']
    case 'recruitment-ujat-volunteer':
      return [
        'recruitVolunteer.detailInfo',
        'recruitVolunteer.h1.detailInfo',
        'recruitVolunteer.h2.detailInfo',
        'recruit.volunteer.h1',
        'recruit.volunteer.h2',
      ]
    case 'application-participant-school':
      return ['application.institution']
    case 'application-economy':
      return ['application.economy']
    case 'application-trained-teachers':
      return ['application.trainedTeachers']
    case 'application-participant-individual':
      return ['application.individual']
    case 'application-instructor':
      return ['application.instructor']
    case 'application-volunteer':
      return ['application.volunteer']
    case 'application-ujat-school':
      return ['ujatApplication', 'application.ujat.inst.basicInfo']
    case 'application-ujat-volunteer':
      return ['ujatVolunteerApplication']
    default:
      return []
  }
}

export function keyMatchesOperationalOverlayPrefixes(
  key: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some(prefix => {
    if (key === prefix) return true
    const needle = prefix.endsWith('.') ? prefix : `${prefix}.`
    return key.startsWith(needle)
  })
}

function pickOverlayKeysByPrefixes(
  record: Record<string, unknown>,
  prefixes: readonly string[]
): Record<string, unknown> {
  if (prefixes.length === 0) return {}
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) out[key] = value
  }
  return out
}

function replaceSharedOverlayKeysByPrefixes(
  store: 'recruit' | 'application',
  prefixes: readonly string[],
  incoming: Record<string, unknown>,
  catalogTemplateId: string
): void {
  const live =
    store === 'recruit'
      ? peekGeneralRecruitOverlayRecord(catalogTemplateId)
      : peekGeneralApplicationOverlayRecord(catalogTemplateId)
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(live)) {
    if (!keyMatchesOperationalOverlayPrefixes(key, prefixes)) next[key] = value
  }
  for (const [key, value] of Object.entries(incoming)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) next[key] = value
  }
  if (store === 'recruit') replaceGeneralRecruitOverlayForScope(catalogTemplateId, next)
  else replaceGeneralApplicationOverlayForScope(catalogTemplateId, next)
}

/** 템플릿 변경 — 해당 카탈로그 탭 overlay만 비운다. 다른 탭·공통정보 브리지는 유지. */
export function resetOperationalOverlayForCatalogId(catalogTemplateId: string): void {
  const kind = resolveOperationalOverlayKind(catalogTemplateId)
  if (kind == null) return
  const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogTemplateId)
  if (kind === 'institution-recruit') {
    // 1사1교·교육받은 교사·일반 기관 모집이 한 스토어를 쓴다. 숫자·라디오 시드는 키 prefix가 없다.
    suppressOperationalSeedDefaults('institution-recruit', ['*'])
    resetApplicantRecruitInstitutionOverlayForScope(catalogTemplateId)
    replaceRecruitDetailInfoIntoGeneralStore(
      undefined,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'gemini-recruit') {
    suppressOperationalSeedDefaults('gemini-recruit', ['*'])
    resetGeminiRecruitOverlayForScope(catalogTemplateId)
    replaceRecruitDetailInfoIntoGeneralStore(
      undefined,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'ujat-recruit-institution') {
    suppressOperationalSeedDefaults('ujat-recruit-institution', ['*'])
    resetUjatRecruitInstitutionOverlayForScope(catalogTemplateId)
    replaceRecruitDetailInfoIntoGeneralStore(
      undefined,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'ujat-recruit-volunteer') {
    suppressOperationalSeedDefaults('ujat-recruit-volunteer', ['*'])
    resetUjatRecruitVolunteerOverlayForScope(catalogTemplateId)
    replaceUjatVolunteerRecruitGeneralStoreSidecar(undefined, catalogTemplateId)
    return
  }
  if (kind === 'ujat-application-institution') {
    suppressOperationalSeedDefaults('ujat-application-institution', ['*'])
    resetUjatApplicationInstitutionOverlayForScope(catalogTemplateId)
    replaceSharedOverlayKeysByPrefixes(
      'application',
      ['application.ujat.inst.basicInfo'],
      {},
      catalogTemplateId
    )
    return
  }
  if (kind === 'ujat-application-volunteer') {
    suppressOperationalSeedDefaults('ujat-application-volunteer', ['*'])
    resetUjatApplicationVolunteerOverlayForScope(catalogTemplateId)
    return
  }
  if (kind === 'program-registration') {
    suppressOperationalSeedDefaults('program-registration', ['*'])
    resetProgramRegistrationOverlayForScope(catalogTemplateId)
    return
  }
  if (kind === 'general-recruit') {
    suppressOperationalSeedDefaults('general-recruit', prefixes)
    replaceSharedOverlayKeysByPrefixes('recruit', prefixes, {}, catalogTemplateId)
    return
  }
  suppressOperationalSeedDefaults('general-application', prefixes)
  replaceSharedOverlayKeysByPrefixes('application', prefixes, {}, catalogTemplateId)
}

export function createSeedDraftForOperationalCatalogId(
  catalogTemplateId: string
): WritingFormDraft | null {
  switch (resolveOperationalCatalogId(catalogTemplateId)) {
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
    case 'recruitment-gemini-visiting-training':
      return createGeminiVisitingTrainingRecruitFormDraft()
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

function overlayRecordForKind(
  kind: OperationalOverlayKind,
  catalogTemplateId: string
): Record<string, unknown> {
  const detailPrefix = recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId)
  const generalRecruit = peekGeneralRecruitOverlayRecord(catalogTemplateId)
  if (kind === 'institution-recruit') {
    return mergeRecruitDetailInfoFromGeneralStore(
      { ...peekApplicantRecruitInstitutionOverlayRecord(catalogTemplateId) },
      detailPrefix,
      generalRecruit
    )
  }
  if (kind === 'gemini-recruit') {
    return mergeRecruitDetailInfoFromGeneralStore(
      { ...peekGeminiRecruitOverlayRecord(catalogTemplateId) },
      detailPrefix,
      generalRecruit
    )
  }
  if (kind === 'general-recruit') {
    return pickOverlayKeysByPrefixes(
      generalRecruit,
      operationalOverlayKeyPrefixesForCatalogId(catalogTemplateId)
    )
  }
  if (kind === 'general-application') {
    return pickOverlayKeysByPrefixes(
      peekGeneralApplicationOverlayRecord(catalogTemplateId),
      operationalOverlayKeyPrefixesForCatalogId(catalogTemplateId)
    )
  }
  if (kind === 'ujat-recruit-institution') {
    return mergeRecruitDetailInfoFromGeneralStore(
      { ...peekUjatRecruitInstitutionOverlayRecord(catalogTemplateId) },
      detailPrefix,
      generalRecruit
    )
  }
  if (kind === 'ujat-recruit-volunteer') {
    return mergeRecruitDetailInfoFromGeneralStore(
      {
        ...peekUjatRecruitVolunteerOverlayRecord(catalogTemplateId),
        ...pickUjatVolunteerRecruitGeneralStoreSidecar(generalRecruit),
      },
      detailPrefix,
      generalRecruit
    )
  }
  if (kind === 'ujat-application-institution') {
    return {
      ...peekUjatApplicationInstitutionOverlayRecord(catalogTemplateId),
      ...pickOverlayKeysByPrefixes(
        peekGeneralApplicationOverlayRecord(catalogTemplateId),
        ['application.ujat.inst.basicInfo']
      ),
    }
  }
  if (kind === 'program-registration') {
    return { ...peekProgramRegistrationOverlayRecord(catalogTemplateId) }
  }
  return stripUjatApplicationVolunteerProgramOnlyFields(
    peekUjatApplicationVolunteerOverlayRecord(catalogTemplateId)
  )
}

export function collectOperationalOverlayForCatalogId(
  catalogTemplateId: string
): Record<string, unknown> | null {
  const kind = resolveOperationalOverlayKind(catalogTemplateId)
  if (kind == null) return null
  return overlayRecordForKind(kind, catalogTemplateId)
}

/**
 * 등록 완료 스냅샷용 — 지금 선택된 모집 양식 버킷만 peek.
 * 활성 스코프(`getRecord`)는 신청 단계로 넘어가면 비므로 persist에 쓰지 않는다.
 */
export function collectSelectedRecruitOverlaysForProgram(
  program: Program
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const spec of listVisibleOperationalFormSpecs(program)) {
    if (spec.formType !== 'RECRUITMENT') continue
    const overlay = collectOperationalOverlayForCatalogId(spec.templateCode)
    if (overlay == null) continue
    Object.assign(merged, overlay)
  }
  return merged
}

export function applyOperationalOverlayForCatalogId(
  catalogTemplateId: string,
  overlay: Record<string, unknown> | undefined
): void {
  const kind = resolveOperationalOverlayKind(catalogTemplateId)
  if (kind == null) return
  if (overlay == null || Object.keys(overlay).length === 0) {
    resetOperationalOverlayForCatalogId(catalogTemplateId)
    return
  }
  const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogTemplateId)
  if (kind === 'institution-recruit') {
    replaceApplicantRecruitInstitutionOverlayForScope(catalogTemplateId, overlay)
    replaceRecruitDetailInfoIntoGeneralStore(
      overlay,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'general-recruit') {
    replaceSharedOverlayKeysByPrefixes('recruit', prefixes, overlay, catalogTemplateId)
    return
  }
  if (kind === 'general-application') {
    replaceSharedOverlayKeysByPrefixes('application', prefixes, overlay, catalogTemplateId)
    return
  }
  if (kind === 'ujat-recruit-institution') {
    replaceUjatRecruitInstitutionOverlayForScope(catalogTemplateId, overlay)
    replaceRecruitDetailInfoIntoGeneralStore(
      overlay,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'gemini-recruit') {
    replaceGeminiRecruitOverlayForScope(catalogTemplateId, overlay)
    replaceRecruitDetailInfoIntoGeneralStore(
      overlay,
      recruitDetailInfoOverlayPrefixForCatalogId(catalogTemplateId),
      catalogTemplateId
    )
    return
  }
  if (kind === 'ujat-recruit-volunteer') {
    replaceUjatRecruitVolunteerOverlayForScope(catalogTemplateId, overlay)
    replaceUjatVolunteerRecruitGeneralStoreSidecar(overlay, catalogTemplateId)
    return
  }
  if (kind === 'ujat-application-institution') {
    replaceUjatApplicationInstitutionOverlayForScope(
      catalogTemplateId,
      pickOverlayKeysByPrefixes(overlay, ['ujatApplication'])
    )
    replaceSharedOverlayKeysByPrefixes(
      'application',
      ['application.ujat.inst.basicInfo'],
      overlay,
      catalogTemplateId
    )
    return
  }
  if (kind === 'program-registration') {
    replaceProgramRegistrationOverlayForScope(catalogTemplateId, overlay)
    return
  }
  replaceUjatApplicationVolunteerOverlayForScope(catalogTemplateId, overlay)
}

/**
 * 「이어서 작성」 진입 시 — localStorage overlay를 공유 스토어에 탭 단위로 복원.
 * 공유 스토어는 prefix만 교체한다. 강사 스냅샷 전체 replace는 1사1교 상세 정보를 지운다.
 */
export async function hydrateRegistrationOperationalOverlaysFromLocalDrafts(
  programType: string,
  variant: RegistrationOperationalDraftVariant
): Promise<void> {
  const { loadRegistrationWizardFormDraft } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant, programType)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const saved = await loadRegistrationWizardFormDraft({
      programType,
      templateCode: catalogId,
    })
    const overlay = saved?.overlay
    if (variant === 'economy' && catalogId === 'recruitment-economy') {
      const { readCompanySchoolRecruitEditorState, companySchoolRecruitStateToApplyRecord } =
        await import('@/features/program/1c-1s/lib/recruit-form-state')
      const recruit = readCompanySchoolRecruitEditorState(saved?.editorState)
      if (recruit) {
        applyOperationalOverlayForCatalogId(
          catalogId,
          companySchoolRecruitStateToApplyRecord(recruit)
        )
        continue
      }
    }
    if (variant === 'economy' && catalogId === 'application-economy') {
      const { readCompanySchoolApplicationEditorState, companySchoolApplicationStateToApplyRecord } =
        await import('@/features/program/1c-1s/lib/application-form-state')
      const application = readCompanySchoolApplicationEditorState(saved?.editorState)
      if (application) {
        applyOperationalOverlayForCatalogId(
          catalogId,
          companySchoolApplicationStateToApplyRecord(application)
        )
        continue
      }
    }
    if (variant === 'trainedTeachers') {
      const { readTrainedTeachersRecruitEditorState, trainedTeachersRecruitStateToApplyRecord } =
        await import('@/features/program/trained-teachers/lib/recruit-form-state')
      const { readTrainedTeachersApplicationEditorState } = await import(
        '@/features/program/trained-teachers/lib/application-form-state'
      )
      if (catalogId === 'recruitment-trained-teachers') {
        const recruit = readTrainedTeachersRecruitEditorState(saved?.editorState)
        if (recruit) {
          applyOperationalOverlayForCatalogId(
            catalogId,
            trainedTeachersRecruitStateToApplyRecord(recruit)
          )
          continue
        }
      }
      if (catalogId === 'application-trained-teachers') {
        const application = readTrainedTeachersApplicationEditorState(saved?.editorState)
        if (application) {
          const projected: Record<string, unknown> = {
            'application.trainedTeachers.preferredSchedules': application.preferredSchedules,
          }
          for (const [key, value] of Object.entries(application.basicInfo)) {
            projected[`application.trainedTeachers.basicInfo.${key}`] = value
          }
          applyOperationalOverlayForCatalogId(catalogId, projected)
          continue
        }
      }
    }
    if (overlay == null || Object.keys(overlay).length === 0) continue
    if (resolveOperationalOverlayKind(catalogId) == null) continue
    applyOperationalOverlayForCatalogId(catalogId, overlay)
  }
}

/**
 * 「임시 저장」— 현재 메모리 overlay를 모든 모집/신청 양식 localStorage에 기록.
 * 현재 단계 handleSave만 하면 다른 탭 상세 정보가 빠진다.
 */
export async function persistRegistrationOperationalOverlaysToLocal(
  programType: string,
  variant: RegistrationOperationalDraftVariant
): Promise<void> {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const { loadRegistrationWizardFormDraft, persistRegistrationWizardFormDraft } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant, programType)) {
    const catalogId = catalogTemplateIdFromOperationalStorageKey(storageKey)
    const saved = await loadRegistrationWizardFormDraft({
      programType,
      templateCode: catalogId,
    })
    const draft = saved?.draft ?? createSeedDraftForOperationalCatalogId(catalogId)
    if (draft == null) continue
    // 공통정보(registration-*)는 handleSave가 settingsJson·RHF snapshot까지 저장한다.
    // 여기서 overlay만 다시 쓰면 국문 대표명 등 RHF 입력이 지워진다.
    if (resolveOperationalOverlayKind(catalogId) === 'program-registration') continue
    if (variant === 'trainedTeachers') {
      const { collectTrainedTeachersRecruitFormState, trainedTeachersRecruitEditorState } =
        await import('@/features/program/trained-teachers/lib/recruit-form-state')
      const { collectTrainedTeachersApplicationFormState, trainedTeachersApplicationEditorState } =
        await import('@/features/program/trained-teachers/lib/application-form-state')
      const editorState =
        catalogId === 'recruitment-trained-teachers'
          ? trainedTeachersRecruitEditorState(collectTrainedTeachersRecruitFormState())
          : catalogId === 'application-trained-teachers'
            ? trainedTeachersApplicationEditorState(collectTrainedTeachersApplicationFormState())
            : saved?.editorState
      await persistRegistrationWizardFormDraft({
        programType,
        templateCode: catalogId,
        draft,
        editorState,
      })
      continue
    }
    if (variant === 'economy' && catalogId === 'recruitment-economy') {
      const { collectCompanySchoolRecruitFormState, companySchoolRecruitEditorState } =
        await import('@/features/program/1c-1s/lib/recruit-form-state')
      await persistRegistrationWizardFormDraft({
        programType,
        templateCode: catalogId,
        draft,
        editorState: companySchoolRecruitEditorState(collectCompanySchoolRecruitFormState()),
      })
      continue
    }
    if (variant === 'economy' && catalogId === 'application-economy') {
      const { collectCompanySchoolApplicationFormState, companySchoolApplicationEditorState } =
        await import('@/features/program/1c-1s/lib/application-form-state')
      await persistRegistrationWizardFormDraft({
        programType,
        templateCode: catalogId,
        draft,
        editorState: companySchoolApplicationEditorState(collectCompanySchoolApplicationFormState()),
      })
      continue
    }
    const overlay = collectOperationalOverlayForCatalogId(catalogId)
    if (overlay == null || Object.keys(overlay).length === 0) continue
    await persistRegistrationWizardFormDraft({
      programType,
      templateCode: catalogId,
      draft,
      overlay: { ...(saved?.overlay ?? {}), ...overlay },
      editorState: saved?.editorState,
      settingsJson: saved?.settingsJson,
    })
  }
}

export function clearRegistrationOperationalFormDrafts(
  _variant: RegistrationOperationalDraftVariant
): void {
  // no-op — 위저드 양식 초안은 localStorage(clearRegistrationProgramDraftLocal)에서 정리한다.
}

/** @deprecated `clearRegistrationOperationalFormDrafts('general')` 사용 */
export function clearGeneralProgramRegistrationOperationalFormDrafts(): void {
  clearRegistrationOperationalFormDrafts('general')
}

/** @deprecated `listRegistrationOperationalFormDraftStorageKeys('general')` 사용 */
export function listGeneralProgramRegistrationOperationalFormTemplateIds(): readonly string[] {
  return listRegistrationOperationalFormDraftStorageKeys('general')
}
