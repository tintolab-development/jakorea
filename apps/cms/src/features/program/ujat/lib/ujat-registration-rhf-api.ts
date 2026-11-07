/**
 * UJAT 등록 위저드 typed 모집 RHF peek.
 * Form Version overlay는 라이브 모집 overlay store가 아니라 이 값을 쓴다.
 */
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { buildUjatRecruitInstitutionOverlayFromDetailEditValues } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'

export type UjatRegistrationRecruitRhfApi = {
  getInstitution: () => ProgramDetailEditFormValues
  getVolunteerH1: () => ProgramDetailEditFormValues
  getVolunteerH2: () => ProgramDetailEditFormValues
}

let api: UjatRegistrationRecruitRhfApi | null = null

export function registerUjatRegistrationRecruitRhf(
  next: UjatRegistrationRecruitRhfApi | null
): void {
  api = next
}

export function peekUjatRegistrationRecruitRhf(): UjatRegistrationRecruitRhfApi | null {
  return api
}

export function peekActiveUjatRecruitInstitutionOverlayRecord(): Record<string, unknown> | null {
  if (api == null) return null
  return buildUjatRecruitInstitutionOverlayFromDetailEditValues(api.getInstitution())
}

export function peekActiveUjatRecruitVolunteerOverlayRecord(): Record<string, unknown> | null {
  if (api == null) return null
  return {
    ...buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(api.getVolunteerH1(), 'h1'),
    ...buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(api.getVolunteerH2(), 'h2'),
  }
}
