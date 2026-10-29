import type { Program } from '@/types/domain'
import { applyEconomyRegistrationOverlayToProgram } from '@/features/program/general/lib/economy-registration-overlay-to-program'
import {
  programToDetailEditValues,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { buildSeededEconomyRegistrationOverlay } from './registration-overlay-sync'

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * 1사1교 상세 공통정보 저장 직전 — 등록 단락(overlay)에서 바꾼 값을 infoForm 필드로 올린다.
 * 단락은 overlay에만 쓰고 저장은 infoForm 기준으로 overlay를 재작성하므로, 그대로 두면
 * 대표 프로그램명 외 모든 단락 입력이 이전 값으로 덮였다.
 * seed 대비 바뀐 overlay 키만 반영해, infoForm만 바뀐 저장 경로는 건드리지 않는다.
 */
export function resolveCompanySchoolDetailSaveLiveFormValues(
  liveOverlay: Record<string, unknown>,
  program: Program
): Partial<ProgramDetailEditFormValues> {
  const seeded = buildSeededEconomyRegistrationOverlay(program)
  const dirty: Record<string, unknown> = {}
  for (const key of Object.keys(liveOverlay)) {
    if (!sameValue(liveOverlay[key], seeded[key])) dirty[key] = liveOverlay[key]
  }
  if (Object.keys(dirty).length === 0) return {}
  const baseValues = programToDetailEditValues(
    applyEconomyRegistrationOverlayToProgram(program, seeded)
  ) as Record<string, unknown>
  const liveValues = programToDetailEditValues(
    applyEconomyRegistrationOverlayToProgram(program, { ...seeded, ...dirty })
  ) as Record<string, unknown>
  const changed: Record<string, unknown> = {}
  for (const key of Object.keys(liveValues)) {
    if (!sameValue(liveValues[key], baseValues[key])) changed[key] = liveValues[key]
  }
  return changed as Partial<ProgramDetailEditFormValues>
}
