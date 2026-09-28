import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
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
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS,
  UJAT_PROGRAM_REGISTRATION_STEPS,
} from '@/features/program/ujat/model/ujat-program-registration-flow'

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
  return SPEC_BY_CODE.get(templateCode)
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

function listGeneralLikeOperationalTemplateCodes(
  program: Program,
  kind: ProgramOperationalBindingKind
): string[] {
  const flags = generalProgramRegistrationFlagsFromProgram(program)
  const tabVisibility = tabVisibilityForBindingKind(kind)
  const codes = GENERAL_PROGRAM_REGISTRATION_STEPS.flatMap(step => {
    if (step.phase !== 'application' && step.phase !== 'recruitment') return []
    if (!isGeneralProgramRegistrationStepVisible(step.key, flags, tabVisibility)) return []
    return [resolveOperationalTemplateCodeForStep(kind, step.templateId, step.key)]
  })
  return [...new Set(codes)]
}

function listUjatOperationalTemplateCodes(): string[] {
  const codes = UJAT_PROGRAM_REGISTRATION_STEPS.flatMap(step => {
    if (step.phase === 'program') return []
    return [step.templateId]
  })
  return [...new Set([...codes, ...UJAT_PROGRAM_REGISTRATION_APPLICATION_TEMPLATE_IDS])]
}

export function listOperationalTemplateCodesForProgram(program: Program): string[] {
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') {
    return listUjatOperationalTemplateCodes()
  }
  if (kind === 'TRAINED_TEACHER') {
    return listGeneralLikeOperationalTemplateCodes(program, kind)
  }
  if (kind === 'COMPANY_SCHOOL') {
    return listGeneralLikeOperationalTemplateCodes(program, kind)
  }
  return listGeneralLikeOperationalTemplateCodes(program, 'GENERAL')
}

export function listVisibleOperationalFormSpecs(program: Program): OperationalFormSpec[] {
  return listOperationalTemplateCodesForProgram(program)
    .map(code => getOperationalFormSpec(code))
    .filter((spec): spec is OperationalFormSpec => spec != null)
}

export function listRegistrationFormTemplateCodeForProgram(program: Program): string | null {
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') return 'registration-ujat'
  if (kind === 'COMPANY_SCHOOL') return 'registration-economy'
  if (kind === 'TRAINED_TEACHER') return 'registration-trained-teachers'
  return 'registration-general'
}

export function getRegistrationFormSpec(templateCode: string): RegistrationCreateFormSpec | undefined {
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

function normalizeBindingType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function roleMatches(binding: ProgramFormBindingResponse, targetRole: string | undefined): boolean {
  if (targetRole == null || targetRole === '') return true
  const role = normalizeBindingType(binding.targetRole || binding.targetType)
  const expected = targetRole.toUpperCase()
  if (!role) return false
  if (role === expected) return true
  if (expected === 'ORGANIZATION') {
    return role.includes('ORGANIZATION') || role.includes('SCHOOL') || role.includes('INSTITUTION')
  }
  if (expected === 'INDIVIDUAL') {
    return role.includes('INDIVIDUAL') || role.includes('PARTICIPANT') || role.includes('MEMBER')
  }
  if (expected === 'INSTRUCTOR') {
    return role.includes('INSTRUCTOR') || role.includes('TEACHER')
  }
  if (expected === 'VOLUNTEER') {
    return role.includes('VOLUNTEER')
  }
  return role.includes(expected)
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
  }
): ProgramFormBindingResponse | undefined {
  const ofType = bindings.filter(
    binding =>
      binding.active !== false && normalizeBindingType(binding.formType) === spec.formType
  )
  if (ofType.length === 0) return undefined

  const roleOrName = ofType.filter(
    binding => roleMatches(binding, spec.targetRole) || nameMatches(binding, spec.nameHints)
  )
  const pool = roleOrName.length > 0 ? roleOrName : ofType

  if (spec.catalogTemplateId != null) {
    const scoped = pool.filter(binding =>
      isProgramScopedOperationalBinding(binding, spec.catalogTemplateId)
    )
    if (scoped.length > 0) return scoped[0]
    const byCatalogId = pool.find(binding => binding.templateId === spec.catalogTemplateId)
    if (byCatalogId) return byCatalogId
  }

  if (roleOrName.length === 1) return roleOrName[0]
  if (roleOrName.length > 1) {
    const byName = roleOrName.find(binding => nameMatches(binding, spec.nameHints))
    if (byName) return byName
    return roleOrName[0]
  }

  return ofType.length === 1 ? ofType[0] : undefined
}
