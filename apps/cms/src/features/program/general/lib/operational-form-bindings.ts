import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  canonicalFormBindingTarget,
  isCanonicalFormBindingAudience,
} from '@/features/program/general/lib/resolve-form-binding-target-type'
import {
  resolveProgramOperationalBindingKind,
  type ProgramOperationalBindingKind,
} from '@/features/program/general/lib/program-operational-binding-profile'
import {
  GENERAL_PROGRAM_REGISTRATION_STEPS,
  isGeneralProgramRegistrationStepVisible,
  type GeneralProgramRegistrationParticipantFlags,
  type GeneralProgramRegistrationTabVisibilityOptions,
} from '@/features/program/general/model/registration-flow'
import {
  pickRecruitmentCopyRow,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import {
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS,
  UJAT_PROGRAM_REGISTRATION_STEPS,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import {
  draftProgramTypeForOperationalBindingKind,
  getSelectedOperationalTemplateCode,
} from '@/features/program/shared/lib/step-template-selection'

export type OperationalFormType = 'APPLICATION' | 'RECRUITMENT' | 'REGISTRATION'

export type OperationalFormSpec = {
  templateCode: string
  formType: OperationalFormType
  targetRole?: string
  nameHints: readonly string[]
}

export type RegistrationCreateFormSpec = OperationalFormSpec & { formType: 'REGISTRATION' }

const REGISTRATION_FORM_SPECS: readonly RegistrationCreateFormSpec[] = [
  {
    templateCode: 'registration-general',
    formType: 'REGISTRATION',
    nameHints: ['일반 프로그램 등록', '프로그램 등록'],
  },
  {
    templateCode: 'registration-economy',
    formType: 'REGISTRATION',
    nameHints: ['1사1교 프로그램 등록', '프로그램 등록'],
  },
  {
    templateCode: 'registration-trained-teachers',
    formType: 'REGISTRATION',
    nameHints: ['교육받은 교사 프로그램 등록', '프로그램 등록'],
  },
  {
    templateCode: 'registration-ujat',
    formType: 'REGISTRATION',
    nameHints: ['UJAT 프로그램 등록', '프로그램 등록'],
  },
]

const REGISTRATION_SPEC_BY_CODE = new Map(
  REGISTRATION_FORM_SPECS.map(spec => [spec.templateCode, spec])
)

const OPERATIONAL_FORM_SPECS: readonly OperationalFormSpec[] = [
  {
    templateCode: 'application-participant-school',
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 신청', '학교 신청', '참여 기관 신청'],
  },
  {
    templateCode: 'application-participant-individual',
    formType: 'APPLICATION',
    targetRole: 'INDIVIDUAL',
    nameHints: ['참여자 신청', '개인 신청'],
  },
  {
    templateCode: 'application-instructor',
    formType: 'APPLICATION',
    targetRole: 'INSTRUCTOR',
    nameHints: ['강사 신청'],
  },
  {
    templateCode: 'application-volunteer',
    formType: 'APPLICATION',
    targetRole: 'VOLUNTEER',
    nameHints: ['봉사자 신청', '봉사 신청'],
  },
  {
    templateCode: 'recruitment-participant-school',
    formType: 'RECRUITMENT',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 모집', '학교 모집', '참여 기관 모집'],
  },
  {
    templateCode: 'recruitment-participant-individual',
    formType: 'RECRUITMENT',
    targetRole: 'INDIVIDUAL',
    nameHints: ['참여자 모집', '개인 모집'],
  },
  {
    templateCode: 'recruitment-instructor',
    formType: 'RECRUITMENT',
    targetRole: 'INSTRUCTOR',
    nameHints: ['강사 모집'],
  },
  {
    templateCode: 'recruitment-volunteer',
    formType: 'RECRUITMENT',
    targetRole: 'VOLUNTEER',
    nameHints: ['봉사자 모집', '봉사 모집'],
  },
  {
    templateCode: 'recruitment-economy',
    formType: 'RECRUITMENT',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 모집', '1사1교 모집', '참여 기관 모집'],
  },
  {
    templateCode: 'application-economy',
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 신청', '1사1교 신청', '참여 기관 신청'],
  },
  {
    templateCode: 'recruitment-trained-teachers',
    formType: 'RECRUITMENT',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 모집', '교육받은 교사 모집', '참여 기관 모집'],
  },
  {
    templateCode: 'application-trained-teachers',
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    nameHints: ['기관 신청', '교육받은 교사 신청', '참여 기관 신청'],
  },
  {
    templateCode: 'recruitment-ujat-school',
    formType: 'RECRUITMENT',
    targetRole: 'ORGANIZATION',
    nameHints: ['참여 기관 모집', 'UJAT 기관 모집', '학교 모집'],
  },
  {
    templateCode: 'recruitment-ujat-volunteer',
    formType: 'RECRUITMENT',
    targetRole: 'VOLUNTEER',
    nameHints: ['봉사자 모집', 'UJAT 봉사자 모집'],
  },
  {
    templateCode: 'application-ujat-school',
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    nameHints: ['참여 기관 신청', 'UJAT 기관 신청', '학교 신청'],
  },
  {
    templateCode: 'application-ujat-volunteer',
    formType: 'APPLICATION',
    targetRole: 'VOLUNTEER',
    nameHints: ['봉사자 신청', 'UJAT 봉사자 신청'],
  },
]

const SPEC_BY_CODE = new Map(OPERATIONAL_FORM_SPECS.map(spec => [spec.templateCode, spec]))

export function getOperationalFormSpec(templateCode: string): OperationalFormSpec | undefined {
  const exact = SPEC_BY_CODE.get(templateCode)
  if (exact) return exact
  const base = resolveWritingFormBaseTemplateCode(templateCode)
  if (base === templateCode) return undefined
  const baseSpec = SPEC_BY_CODE.get(base)
  if (baseSpec == null) return undefined
  return { ...baseSpec, templateCode }
}

export function generalProgramRegistrationFlagsFromProgram(
  program: Program
): GeneralProgramRegistrationParticipantFlags {
  const types = getGeneralParticipantTypes(program)
  return {
    individual: types.includes('individual'),
    organization: types.includes('school_institution'),
    teacherInstructor: types.includes('teacher_instructor'),
    volunteer: types.includes('volunteer'),
  }
}

function tabVisibilityForBindingKind(
  kind: ProgramOperationalBindingKind
): GeneralProgramRegistrationTabVisibilityOptions | undefined {
  if (kind === 'COMPANY_SCHOOL' || kind === 'TRAINED_TEACHER') {
    return { hideVolunteer: true }
  }
  return undefined
}

function resolveOperationalTemplateCodeForStep(
  kind: ProgramOperationalBindingKind,
  stepTemplateId: string,
  stepKey: string
): string {
  if (kind === 'COMPANY_SCHOOL') {
    if (stepKey === 'recruit-participant-school') return 'recruitment-economy'
    if (stepKey === 'application-participant-school') return 'application-economy'
  }
  if (kind === 'TRAINED_TEACHER') {
    if (stepKey === 'recruit-participant-school') return 'recruitment-trained-teachers'
    if (stepKey === 'application-participant-school') return 'application-trained-teachers'
  }
  return stepTemplateId
}

function operationalSpecBindingKey(spec: OperationalFormSpec): string {
  return `${spec.formType}:${spec.targetRole ?? ''}`
}

function listGeneralLikeOperationalFormSpecs(
  program: Program,
  kind: ProgramOperationalBindingKind
): OperationalFormSpec[] {
  const flags = generalProgramRegistrationFlagsFromProgram(program)
  const tabVisibility = tabVisibilityForBindingKind(kind)
  const programType = draftProgramTypeForOperationalBindingKind(kind)
  const specs: OperationalFormSpec[] = []
  const seen = new Set<string>()
  for (const step of GENERAL_PROGRAM_REGISTRATION_STEPS) {
    if (step.phase !== 'application' && step.phase !== 'recruitment') continue
    if (!isGeneralProgramRegistrationStepVisible(step.key, flags, tabVisibility)) continue
    const defaultCode = resolveOperationalTemplateCodeForStep(kind, step.templateId, step.key)
    const defaultSpec = getOperationalFormSpec(defaultCode)
    if (defaultSpec == null) continue
    const selected = getSelectedOperationalTemplateCode(programType, step.key, defaultCode)
    const spec: OperationalFormSpec = { ...defaultSpec, templateCode: selected }
    const bindingKey = operationalSpecBindingKey(spec)
    if (seen.has(bindingKey)) continue
    seen.add(bindingKey)
    specs.push(spec)
  }
  return specs
}

function listUjatOperationalFormSpecs(): OperationalFormSpec[] {
  const programType = 'UJAT'
  const specs: OperationalFormSpec[] = []
  const seen = new Set<string>()
  for (const step of UJAT_PROGRAM_REGISTRATION_STEPS) {
    if (step.phase === 'program') continue
    const defaultSpec = getOperationalFormSpec(step.templateId)
    if (defaultSpec == null) continue
    const selected = getSelectedOperationalTemplateCode(programType, step.key, step.templateId)
    const spec: OperationalFormSpec = { ...defaultSpec, templateCode: selected }
    const bindingKey = operationalSpecBindingKey(spec)
    if (seen.has(bindingKey)) continue
    seen.add(bindingKey)
    specs.push(spec)
  }
  for (const code of UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS) {
    const spec = getOperationalFormSpec(code)
    if (spec == null) continue
    const bindingKey = operationalSpecBindingKey(spec)
    if (seen.has(bindingKey)) continue
    seen.add(bindingKey)
    specs.push(spec)
  }
  return specs
}

function listOperationalFormSpecsForProgram(program: Program): OperationalFormSpec[] {
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') return listUjatOperationalFormSpecs()
  if (kind === 'TRAINED_TEACHER') return listGeneralLikeOperationalFormSpecs(program, kind)
  if (kind === 'COMPANY_SCHOOL') return listGeneralLikeOperationalFormSpecs(program, kind)
  return listGeneralLikeOperationalFormSpecs(program, 'GENERAL')
}

export function listOperationalTemplateCodesForProgram(program: Program): string[] {
  return [...new Set(listOperationalFormSpecsForProgram(program).map(spec => spec.templateCode))]
}

export function listVisibleOperationalFormSpecs(program: Program): OperationalFormSpec[] {
  return listOperationalFormSpecsForProgram(program)
}

export function listRegistrationFormTemplateCodeForProgram(program: Program): string | null {
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') return 'registration-ujat'
  if (kind === 'COMPANY_SCHOOL') return 'registration-economy'
  if (kind === 'TRAINED_TEACHER') return 'registration-trained-teachers'
  return 'registration-general'
}

export function getRegistrationFormSpec(
  templateCode: string
): RegistrationCreateFormSpec | undefined {
  return REGISTRATION_SPEC_BY_CODE.get(templateCode)
}

/** create formBindings — REGISTRATION 1 + visible operational(recruit/application) */
export function listAllRegistrationCreateFormSpecs(program: Program): OperationalFormSpec[] {
  const registrationCode = listRegistrationFormTemplateCodeForProgram(program)
  const registrationSpec =
    registrationCode != null ? getRegistrationFormSpec(registrationCode) : undefined
  const operational = listVisibleOperationalFormSpecs(program)
  return registrationSpec != null ? [registrationSpec, ...operational] : operational
}

const RECRUITMENT_ROW_PROGRAM_TYPES = new Set([
  'GENERAL',
  'GENERAL_INDIVIDUAL',
  'GENERAL_ORGANIZATION',
  'UJAT',
  'COMPANY_SCHOOL',
  'TRAINED_TEACHER',
])

function normalizeBindingType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

/** APPLICATION만 모집 행에 묶는다. RECRUITMENT 양식은 프로그램 단위다. */
export function recruitmentApplicationBindingScope(
  program: Program,
  formType: string | undefined
): { targetScope: 'RECRUITMENT'; targetScopeId: number } | undefined {
  if (normalizeBindingType(formType) !== 'APPLICATION') return undefined
  const programType = program.backendProgramType?.trim().toUpperCase()
  if (programType == null || !RECRUITMENT_ROW_PROGRAM_TYPES.has(programType)) return undefined
  const recruitmentId = program.activeRecruitmentId
  if (recruitmentId == null || !Number.isSafeInteger(recruitmentId) || recruitmentId <= 0) {
    return undefined
  }
  return { targetScope: 'RECRUITMENT', targetScopeId: recruitmentId }
}

/**
 * 신청 양식 미리보기·수정이 Portal `application-options.formBindingId`(모집 행 scope)와
 * 같은 바인딩을 쓰도록 `activeRecruitmentId` 를 맞춘다.
 */
export function applicationAudienceForEditorVariant(
  variant: ProgramParticipantApplicationEditorVariant
): RecruitmentCopyAudience | null {
  if (variant === 'instructor') return 'instructor'
  if (variant === 'volunteer') return 'volunteer'
  if (
    variant === 'institution' ||
    variant === 'individual' ||
    variant === 'economy-application-institution' ||
    variant === 'trained-teachers-application-institution'
  ) {
    return 'participant'
  }
  return null
}

export function programWithApplicationFormRecruitmentScope(
  program: Program,
  audience: RecruitmentCopyAudience
): Program {
  const rows = program.programRecruitments ?? []
  let row = pickRecruitmentCopyRow(program, audience)
  if (audience === 'participant' && rows.length > 0) {
    const participants = rows.filter(
      item => (item.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
    )
    if (participants.length > 1) {
      const types = getGeneralParticipantTypes(program)
      const want =
        types.includes('individual') && !types.includes('school_institution')
          ? 'INDIVIDUAL'
          : types.includes('school_institution')
            ? 'ORGANIZATION'
            : null
      if (want != null) {
        const byType = participants.find(
          item => (item.applicationType ?? '').toUpperCase() === want
        )
        if (byType != null) row = byType
      }
    }
  }
  if (row?.id == null) return program
  if (program.activeRecruitmentId === row.id) return program
  return { ...program, activeRecruitmentId: row.id }
}

/** 신청 양식 진입·저장이 같은 모집 행(`activeRecruitmentId`)을 쓰도록 맞춘다. */
export function programForApplicationFormEditor(
  program: Program,
  variant: ProgramParticipantApplicationEditorVariant
): Program {
  const audience = applicationAudienceForEditorVariant(variant)
  return audience != null ? programWithApplicationFormRecruitmentScope(program, audience) : program
}

export type RowApplicationBindingResolution =
  | { kind: 'unscoped' }
  | { kind: 'missing' }
  | { kind: 'binding'; binding: ProgramFormBindingResponse }

/**
 * 행 `applicationFormBindingId`를 우선한다.
 * 비어 있거나 깨져 있으면 같은 모집 `targetScope=RECRUITMENT` 바인딩을 고른다.
 * 프로그램 단위 바인딩으로 바꾸지 않는다.
 */
export function resolveRowApplicationBinding(
  program: Program,
  bindings: readonly ProgramFormBindingResponse[],
  spec: Pick<OperationalFormSpec, 'formType' | 'targetRole'>
): RowApplicationBindingResolution {
  const scope = recruitmentApplicationBindingScope(program, spec.formType)
  if (scope == null) {
    return { kind: 'unscoped' }
  }
  const row = program.programRecruitments?.find(item => item.id === program.activeRecruitmentId)
  const bindingId = row?.applicationFormBindingId
  if (bindingId != null) {
    const binding = bindings.find(item => item.bindingId === bindingId && item.active !== false)
    if (binding != null) return { kind: 'binding', binding }
  }
  const byScope = bindings.find(item => {
    if (item.active === false) return false
    if (normalizeBindingType(item.formType) !== 'APPLICATION') return false
    if ((item.targetScope ?? '').toUpperCase() !== 'RECRUITMENT') return false
    if (item.targetScopeId !== scope.targetScopeId) return false
    return roleMatches(item, spec.targetRole)
  })
  if (byScope != null) return { kind: 'binding', binding: byScope }
  return { kind: 'missing' }
}

/**
 * CREATE 후 BE `fanOutProgramBindings`가 만든 모집 행(RECRUITMENT scope) 신청 바인딩 중
 * spec 역할과 맞는 활성 바인딩 목록. 행마다 독립 양식이므로 CREATE 후 양식 적용은 행 단위로 한다.
 */
export function listRecruitmentRowApplicationBindings(
  program: Pick<Program, 'backendProgramType'>,
  bindings: readonly ProgramFormBindingResponse[],
  spec: Pick<OperationalFormSpec, 'formType' | 'targetRole'>
): ProgramFormBindingResponse[] {
  if (normalizeBindingType(spec.formType) !== 'APPLICATION') return []
  const programType = program.backendProgramType?.trim().toUpperCase()
  if (programType == null || !RECRUITMENT_ROW_PROGRAM_TYPES.has(programType)) return []
  return bindings.filter(
    item =>
      item.active !== false &&
      normalizeBindingType(item.formType) === 'APPLICATION' &&
      (item.targetScope ?? '').toUpperCase() === 'RECRUITMENT' &&
      item.targetScopeId != null &&
      roleMatches(item, spec.targetRole)
  )
}

function roleMatches(binding: ProgramFormBindingResponse, targetRole: string | undefined): boolean {
  if (targetRole == null || targetRole === '') return true
  const expected = canonicalFormBindingTarget(targetRole)
  const targetType = canonicalFormBindingTarget(binding.targetType)

  /**
   * BE는 `target_type`만 정규화해 모집 행과 바인딩을 맞춘다(fan-out·seed·application-options).
   * 대상 값이 신청 대상으로 읽히면 그것만 본다. 예) INSTRUCTOR+MEMBER(모집 행 fan-out)는 강사,
   * ORGANIZATION+TEACHER(기관 신청)는 기관, COLLEGE_STUDENT(CMS 생성 봉사자)는 봉사자.
   */
  if (isCanonicalFormBindingAudience(targetType)) return targetType === expected

  // targetType이 비었거나 신청 대상이 아닌 레거시 행만 targetRole로 판단한다.
  const role = canonicalFormBindingTarget(binding.targetRole)
  if (!role) return false
  if (role === expected) return true
  if (expected === 'INDIVIDUAL') return role === 'PARTICIPANT' || role === 'MEMBER'
  return false
}

function nameMatches(binding: ProgramFormBindingResponse, hints: readonly string[]): boolean {
  const name = (binding.templateName ?? '').trim()
  if (!name) return false
  return hints.some(hint => name.includes(hint))
}

export function isProgramScopedOperationalBinding(
  binding: ProgramFormBindingResponse,
  catalogTemplateId: number | undefined
): boolean {
  const label = (binding.versionLabel ?? '').toLowerCase()
  if (label.includes('program-')) return true
  if (catalogTemplateId == null || binding.templateId == null) return false
  return binding.templateId !== catalogTemplateId
}

export function pickOperationalFormBinding(
  bindings: readonly ProgramFormBindingResponse[],
  spec: Pick<OperationalFormSpec, 'formType' | 'targetRole' | 'nameHints'> & {
    catalogTemplateId?: number
  },
  options?: { claimedBindingIds?: ReadonlySet<number> }
): ProgramFormBindingResponse | undefined {
  const verifySelection = (binding: ProgramFormBindingResponse | undefined) => {
    const bindingId = binding?.bindingId
    if (bindingId != null && options?.claimedBindingIds?.has(Number(bindingId))) {
      return undefined
    }
    return binding
  }

  const ofType = bindings.filter(
    binding => binding.active !== false && normalizeBindingType(binding.formType) === spec.formType
  )
  if (ofType.length === 0) return undefined

  const roleMatched = ofType.filter(binding => roleMatches(binding, spec.targetRole))
  const nameMatched =
    spec.targetRole === 'INSTRUCTOR'
      ? []
      : ofType.filter(binding => nameMatches(binding, spec.nameHints))
  const roleOrName = roleMatched.length > 0 ? roleMatched : nameMatched
  const pool = roleOrName.length > 0 ? roleOrName : spec.targetRole ? [] : ofType

  if (spec.catalogTemplateId != null) {
    const scoped = pool.filter(binding =>
      isProgramScopedOperationalBinding(binding, spec.catalogTemplateId)
    )
    if (scoped.length > 0) return verifySelection(scoped[0])
    const byCatalogId = pool.find(binding => binding.templateId === spec.catalogTemplateId)
    if (byCatalogId) return verifySelection(byCatalogId)
  }

  if (roleOrName.length === 1) return verifySelection(roleOrName[0])
  if (roleOrName.length > 1) {
    const byName = roleOrName.find(binding => nameMatches(binding, spec.nameHints))
    if (byName) return verifySelection(byName)
    return verifySelection(roleOrName[0])
  }

  // 역할이 있는 스펙은 「APPLICATION이 하나뿐」이라는 이유만으로 그 바인딩을 쓰지 않는다.
  // 1사1교 기관 신청이 강사 신청 바인딩을 가져가면 등록 후 강사 양식 적용이 실패한다.
  if (!spec.targetRole && ofType.length === 1) return verifySelection(ofType[0])
  return undefined
}
