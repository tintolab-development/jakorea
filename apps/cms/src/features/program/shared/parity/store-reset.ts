/**
 * parity 테스트 — in-memory operational overlay를 GET fixture만 반영하도록 초기화.
 */
import { resetProgramRegistrationOverlayStoreForTests } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { resetGeneralRecruitOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { seedOperationalRecruitOverlaysFromProgram } from '@/features/program/general/lib/detail-operational-save-merge'
import { seedGeneralRegistrationOverlayFromProgram } from '@/features/program/general/lib/registration-overlay-sync'
import type { Program } from '@/types/domain'

export function resetAllOperationalOverlayStoresForParity(): void {
  resetProgramRegistrationOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
}

/** GET Program의 persisted overlay만 operational store에 시드 (live 경로 테스트용) */
export function seedOperationalStoresFromProgramForParity(program: Program): void {
  resetAllOperationalOverlayStoresForParity()
  seedGeneralRegistrationOverlayFromProgram(program)
  seedOperationalRecruitOverlaysFromProgram(program)
}
