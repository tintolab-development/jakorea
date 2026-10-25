import type { Program } from '@/types/domain'
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { applyUjatRegistrationTemplateDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'

/** UJAT 프로그램 상세·목록 — 공통정보는 등록 overlay만. 모집 탭은 패널에서 따로 병합. */
export function resolveUjatProgramDisplayProgram(
  program: Program
): Program & { ujatTypedDetail?: UjatTypedDetail } {
  return applyUjatRegistrationTemplateDefaults(program)
}
