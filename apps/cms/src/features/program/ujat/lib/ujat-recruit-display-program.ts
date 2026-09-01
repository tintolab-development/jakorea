import type { Program } from '@/types/domain'
import { applyUjatRecruitInstitutionTemplateDefaults } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { applyUjatRecruitVolunteerTemplateDefaults } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'

/** UJAT 모집 정보 화면 — 프로그램 mock + 폼 양식 localStorage 오버레이 병합 (programService 와 동일) */
export function resolveUjatRecruitDisplayProgram(program: Program): Program {
  return applyUjatRecruitVolunteerTemplateDefaults(
    applyUjatRecruitInstitutionTemplateDefaults(program)
  )
}
