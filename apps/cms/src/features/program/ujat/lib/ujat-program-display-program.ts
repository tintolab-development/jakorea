import type { Program } from '@/types/domain'
import { applyUjatRegistrationTemplateDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { resolveUjatRecruitDisplayProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'

/** UJAT 프로그램 상세·목록 — 등록 양식 + 모집 양식 overlay 병합 */
export function resolveUjatProgramDisplayProgram(program: Program): Program {
  return resolveUjatRecruitDisplayProgram(applyUjatRegistrationTemplateDefaults(program))
}
