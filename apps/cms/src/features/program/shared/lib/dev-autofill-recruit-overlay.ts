/**
 * DEV 자동입력 — 모집 overlay를 활성 탭이 아니라 선택된 모집 templateCode 버킷에 merge.
 * 활성 스코프는 바꾸지 않는다.
 */

import {
  GENERAL_PROGRAM_REGISTRATION_STEPS,
  isGeneralProgramRegistrationStepVisible,
  type GeneralProgramRegistrationParticipantFlags,
} from '@/features/program/general/model/registration-flow'
import {
  draftProgramTypeForOperationalBindingKind,
  getSelectedOperationalTemplateCode,
} from '@/features/program/shared/lib/step-template-selection'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  peekApplicantRecruitInstitutionOverlayRecord,
  replaceApplicantRecruitInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  peekUjatRecruitInstitutionOverlayRecord,
  replaceUjatRecruitInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  peekUjatRecruitVolunteerOverlayRecord,
  replaceUjatRecruitVolunteerOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { UJAT_PROGRAM_REGISTRATION_STEPS } from '@/features/program/ujat/model/ujat-program-registration-flow'

export type DevAutofillRegistrationVariant = ProgramRegistrationFormVariant | 'ujat'

export type DevAutofillRecruitOverlayTargets = {
  generalRecruit: string[]
  institutionRecruit: string[]
  ujatInstitution: string[]
  ujatVolunteer: string[]
}

export type DevAutofillRecruitOverlayPartials = {
  general?: Record<string, unknown>
  institution?: Record<string, unknown>
  ujatInstitution?: Record<string, unknown>
  ujatVolunteer?: Record<string, unknown>
}

const FALLBACK_GENERAL_FLAGS: GeneralProgramRegistrationParticipantFlags = {
  individual: true,
  organization: false,
  teacherInstructor: true,
  volunteer: true,
}

const FALLBACK_ORG_FLAGS: GeneralProgramRegistrationParticipantFlags = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
}

function uniqueCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.map(code => code.trim()).filter(code => code !== ''))]
}

function mergeOverlayForScopes(
  peek: (templateCode: string) => Record<string, unknown>,
  replaceFor: (templateCode: string, next: Record<string, unknown>) => void,
  codes: readonly string[],
  partial: Record<string, unknown>
): void {
  if (Object.keys(partial).length === 0) return
  for (const code of uniqueCodes(codes)) {
    replaceFor(code, { ...peek(code), ...partial })
  }
}

function selectionProgramType(
  variant: DevAutofillRegistrationVariant
): ReturnType<typeof draftProgramTypeForOperationalBindingKind> {
  if (variant === 'economy') return 'COMPANY_SCHOOL'
  if (variant === 'trainedTeachers') return 'TRAINED_TEACHER'
  if (variant === 'ujat') return 'UJAT'
  return 'GENERAL'
}

function defaultRecruitTemplateCode(
  variant: DevAutofillRegistrationVariant,
  stepKey: string,
  stepTemplateId: string
): string {
  if (variant === 'economy' && stepKey === 'recruit-participant-school') {
    return 'recruitment-economy'
  }
  if (variant === 'trainedTeachers' && stepKey === 'recruit-participant-school') {
    return 'recruitment-trained-teachers'
  }
  return stepTemplateId
}

function resolveParticipantFlags(
  variant: DevAutofillRegistrationVariant,
  participant: GeneralProgramRegistrationParticipantFlags | undefined
): GeneralProgramRegistrationParticipantFlags {
  if (participant != null) return participant
  if (variant === 'economy' || variant === 'trainedTeachers') return FALLBACK_ORG_FLAGS
  if (variant === 'ujat') {
    return { individual: false, organization: true, teacherInstructor: false, volunteer: true }
  }
  return FALLBACK_GENERAL_FLAGS
}

export function listDevAutofillRecruitOverlayTargets(
  variant: DevAutofillRegistrationVariant,
  participant?: GeneralProgramRegistrationParticipantFlags
): DevAutofillRecruitOverlayTargets {
  const programType = selectionProgramType(variant)
  const generalRecruit: string[] = []
  const institutionRecruit: string[] = []
  const ujatInstitution: string[] = []
  const ujatVolunteer: string[] = []

  if (variant === 'ujat') {
    for (const step of UJAT_PROGRAM_REGISTRATION_STEPS) {
      if (step.phase !== 'recruitment') continue
      const selected = getSelectedOperationalTemplateCode(
        programType,
        step.key,
        step.templateId
      )
      if (step.key === 'recruit-participant') ujatInstitution.push(selected)
      else ujatVolunteer.push(selected)
    }
    return {
      generalRecruit: uniqueCodes(generalRecruit),
      institutionRecruit: uniqueCodes(institutionRecruit),
      ujatInstitution: uniqueCodes(ujatInstitution),
      ujatVolunteer: uniqueCodes(ujatVolunteer),
    }
  }

  const flags = resolveParticipantFlags(variant, participant)
  const tabVisibility =
    variant === 'economy' || variant === 'trainedTeachers'
      ? { hideVolunteer: true }
      : undefined

  for (const step of GENERAL_PROGRAM_REGISTRATION_STEPS) {
    if (step.phase !== 'recruitment') continue
    if (!isGeneralProgramRegistrationStepVisible(step.key, flags, tabVisibility)) continue
    const defaultCode = defaultRecruitTemplateCode(variant, step.key, step.templateId)
    const selected = getSelectedOperationalTemplateCode(programType, step.key, defaultCode)
    if (step.key === 'recruit-participant-school') institutionRecruit.push(selected)
    else generalRecruit.push(selected)
  }

  return {
    generalRecruit: uniqueCodes(generalRecruit),
    institutionRecruit: uniqueCodes(institutionRecruit),
    ujatInstitution: uniqueCodes(ujatInstitution),
    ujatVolunteer: uniqueCodes(ujatVolunteer),
  }
}

export function mergeDevAutofillGeneralRecruitOverlay(
  codes: readonly string[],
  partial: Record<string, unknown>
): void {
  mergeOverlayForScopes(
    peekGeneralRecruitOverlayRecord,
    replaceGeneralRecruitOverlayForScope,
    codes,
    partial
  )
}

export function mergeDevAutofillApplicantRecruitOverlay(
  codes: readonly string[],
  partial: Record<string, unknown>
): void {
  mergeOverlayForScopes(
    peekApplicantRecruitInstitutionOverlayRecord,
    replaceApplicantRecruitInstitutionOverlayForScope,
    codes,
    partial
  )
}

export function mergeDevAutofillUjatRecruitInstitutionOverlay(
  codes: readonly string[],
  partial: Record<string, unknown>
): void {
  mergeOverlayForScopes(
    peekUjatRecruitInstitutionOverlayRecord,
    replaceUjatRecruitInstitutionOverlayForScope,
    codes,
    partial
  )
}

export function mergeDevAutofillUjatRecruitVolunteerOverlay(
  codes: readonly string[],
  partial: Record<string, unknown>
): void {
  mergeOverlayForScopes(
    peekUjatRecruitVolunteerOverlayRecord,
    replaceUjatRecruitVolunteerOverlayForScope,
    codes,
    partial
  )
}

/** 활성 스코프는 유지한 채, 선택된 모집 버킷에만 merge */
export function applyDevAutofillRecruitOverlayPartials(
  variant: DevAutofillRegistrationVariant,
  participant: GeneralProgramRegistrationParticipantFlags | undefined,
  partials: DevAutofillRecruitOverlayPartials
): void {
  const targets = listDevAutofillRecruitOverlayTargets(variant, participant)
  if (partials.institution != null) {
    mergeDevAutofillApplicantRecruitOverlay(targets.institutionRecruit, partials.institution)
  }
  if (partials.general != null) {
    mergeDevAutofillGeneralRecruitOverlay(
      [
        ...targets.generalRecruit,
        ...targets.institutionRecruit,
        ...targets.ujatInstitution,
        ...targets.ujatVolunteer,
      ],
      partials.general
    )
  }
  if (partials.ujatInstitution != null) {
    mergeDevAutofillUjatRecruitInstitutionOverlay(
      targets.ujatInstitution,
      partials.ujatInstitution
    )
  }
  if (partials.ujatVolunteer != null) {
    mergeDevAutofillUjatRecruitVolunteerOverlay(targets.ujatVolunteer, partials.ujatVolunteer)
  }
}
