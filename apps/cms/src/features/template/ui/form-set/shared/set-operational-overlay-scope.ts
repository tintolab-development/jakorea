import {
  resetAllGeneralApplicationOverlay,
  setGeneralApplicationOverlayScope,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  resetAllUjatApplicationInstitutionOverlay,
  setUjatApplicationInstitutionOverlayScope,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  resetAllUjatApplicationVolunteerOverlay,
  setUjatApplicationVolunteerOverlayScope,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  resetAllGeminiRecruitForms,
  setGeminiRecruitFormScope,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import {
  resetAllApplicantRecruitInstitutionOverlay,
  setApplicantRecruitInstitutionOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  resetAllUjatRecruitInstitutionOverlay,
  setUjatRecruitInstitutionOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  resetAllUjatRecruitVolunteerOverlay,
  setUjatRecruitVolunteerOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  resetAllGeneralRecruitOverlay,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetAllProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { resetAllUjatProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'

/**
 * 모집·신청 운영 overlay 스토어의 활성 버킷을 persist templateCode로 맞춘다.
 * 프로그램 등록(공통정보) overlay는 별도 스코프 — 여기서 바꾸면 공통 단락이 렌더 중 갱신된다.
 */
export function setOperationalOverlayScope(templateCode: string | undefined | null): void {
  setGeneralRecruitOverlayScope(templateCode)
  setApplicantRecruitInstitutionOverlayScope(templateCode)
  setUjatRecruitInstitutionOverlayScope(templateCode)
  setUjatRecruitVolunteerOverlayScope(templateCode)
  setGeminiRecruitFormScope(templateCode)
  setGeneralApplicationOverlayScope(templateCode)
  setUjatApplicationInstitutionOverlayScope(templateCode)
  setUjatApplicationVolunteerOverlayScope(templateCode)
}

/** 등록 위저드 종료·신규 시작 — 모든 모집·신청·등록 overlay 버킷 */
export function resetAllOperationalOverlayStores(): void {
  resetAllGeneralRecruitOverlay()
  resetAllApplicantRecruitInstitutionOverlay()
  resetAllUjatRecruitInstitutionOverlay()
  resetAllUjatRecruitVolunteerOverlay()
  resetAllGeminiRecruitForms()
  resetAllGeneralApplicationOverlay()
  resetAllUjatApplicationInstitutionOverlay()
  resetAllUjatApplicationVolunteerOverlay()
  resetAllProgramRegistrationOverlay()
  resetAllUjatProgramRegistrationOverlay()
}

export const resetAllOperationalOverlayStoresForTests = resetAllOperationalOverlayStores
