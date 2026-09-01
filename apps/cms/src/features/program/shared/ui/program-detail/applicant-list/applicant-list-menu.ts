import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'

/** ApplicantList / useApplicantsDetail 메뉴 키 (일반 상세 개인 신청 목록 포함) */
export type ApplicantListMenu = TabKey | 'individual-applications'

export type InstitutionColumnPreset = 'legacy' | 'general-detail' | 'company-school'

export type InstructorColumnPreset = 'legacy' | 'general-detail'

export type SessionLinePreset = 'legacy' | 'general-detail'
