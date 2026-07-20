/**
 * 일반 프로그램 > 진행 현황 > 참여 기관 목록 행 클릭 시 상세 (풀페이지 인라인)
 * UJAT 참여 기관 상세는 `features/program/ujat/.../progress/institutions/detail/` — 본 파일과 분리 유지.
 */
export {
  GeneralParticipatingInstitutionDetailView,
  type GeneralParticipatingInstitutionDetailViewProps,
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  normalizeParticipatingInstitutionDetailTab as normalizeGeneralParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
  type SchoolDetailTabKey,
  normalizeParticipatingInstitutionDetailTab,
} from './school-detail-fullpage-view'

export type { ParticipatingInstitutionDetailTabKey } from '../../../lib/participating-institution-detail-tabs'
