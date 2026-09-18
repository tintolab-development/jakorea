import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  GENERAL_PROGRAM_REGISTRATION_STEPS,
  isGeneralProgramRegistrationStepVisible,
  type GeneralProgramRegistrationParticipantFlags,
} from '@/features/program/general/model/registration-flow'

export type OperationalFormType = 'APPLICATION' | 'RECRUITMENT'

export type OperationalFormSpec = {
  templateCode: string
  formType: OperationalFormType
  targetRole: string
  nameHints: readonly string[]
}

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

export function listVisibleOperationalFormSpecs(program: Program): OperationalFormSpec[] {
  const flags = generalProgramRegistrationFlagsFromProgram(program)
  return GENERAL_PROGRAM_REGISTRATION_STEPS.flatMap(step => {
    if (step.phase !== 'application' && step.phase !== 'recruitment') return []
    if (!isGeneralProgramRegistrationStepVisible(step.key, flags)) return []
    const spec = getOperationalFormSpec(step.templateId)
    return spec != null ? [spec] : []
  })
}

function normalizeBindingType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function roleMatches(binding: ProgramFormBindingResponse, targetRole: string): boolean {
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
