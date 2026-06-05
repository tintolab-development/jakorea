/**
 * 일반 프로그램 유형 (등록 폼 선택 → 8종 분류)
 *
 * 대분류: 참여자 유형 [개인] / [기관]
 * 중분류: 교육 진행 구조 [커리큘럼형] / [일정형]
 * 소분류: 수업 회차 유형 [단일 회차] / [복수 회차]
 */

import type {
  GeneralProgramAudienceKind,
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
} from '@/types/domain'

export type GeneralProgramVariant = {
  audience: GeneralProgramAudienceKind
  educationStructure: GeneralProgramEducationStructure
  sessionRound: GeneralProgramSessionRoundKind
}

export type {
  GeneralProgramAudienceKind,
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
} from '@/types/domain'

export const GENERAL_PROGRAM_AUDIENCE_LABELS: Record<GeneralProgramAudienceKind, string> = {
  organization: '기관',
  individual: '개인',
}

export const GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS: Record<
  GeneralProgramEducationStructure,
  string
> = {
  curriculum: '커리큘럼형',
  schedule: '일정형',
}

export const GENERAL_PROGRAM_SESSION_ROUND_LABELS: Record<
  GeneralProgramSessionRoundKind,
  string
> = {
  single: '단일 회차',
  multi: '복수 회차',
}

/** 8종 전체 조합 (등록 폼 선택에 따른 프로그램 종류) */
export const GENERAL_PROGRAM_VARIANTS: readonly GeneralProgramVariant[] = [
  { audience: 'organization', educationStructure: 'curriculum', sessionRound: 'single' },
  { audience: 'organization', educationStructure: 'curriculum', sessionRound: 'multi' },
  { audience: 'individual', educationStructure: 'curriculum', sessionRound: 'single' },
  { audience: 'individual', educationStructure: 'curriculum', sessionRound: 'multi' },
  { audience: 'organization', educationStructure: 'schedule', sessionRound: 'single' },
  { audience: 'organization', educationStructure: 'schedule', sessionRound: 'multi' },
  { audience: 'individual', educationStructure: 'schedule', sessionRound: 'single' },
  { audience: 'individual', educationStructure: 'schedule', sessionRound: 'multi' },
] as const

export function buildGeneralProgramVariantTitle(variant: GeneralProgramVariant): string {
  const audience = GENERAL_PROGRAM_AUDIENCE_LABELS[variant.audience]
  const structure = GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[variant.educationStructure]
  const session = GENERAL_PROGRAM_SESSION_ROUND_LABELS[variant.sessionRound]
  return `일반 프로그램 (${audience})_${structure}_${session}`
}

export function generalProgramVariantIdSuffix(variant: GeneralProgramVariant): string {
  const a = variant.audience === 'organization' ? 'org' : 'ind'
  const e = variant.educationStructure === 'curriculum' ? 'curriculum' : 'schedule'
  const s = variant.sessionRound === 'single' ? 'single' : 'multi'
  return `${a}-${e}-${s}`
}

export function resolveGeneralProgramVariantFromProgram(program: {
  generalProgramAudience?: GeneralProgramAudienceKind
  generalProgramEducationStructure?: GeneralProgramEducationStructure
  generalProgramSessionRound?: GeneralProgramSessionRoundKind
}): GeneralProgramVariant | null {
  const { generalProgramAudience, generalProgramEducationStructure, generalProgramSessionRound } =
    program
  if (
    generalProgramAudience == null ||
    generalProgramEducationStructure == null ||
    generalProgramSessionRound == null
  ) {
    return null
  }
  return {
    audience: generalProgramAudience,
    educationStructure: generalProgramEducationStructure,
    sessionRound: generalProgramSessionRound,
  }
}
