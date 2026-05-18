/**
 * UJAT 모집 폼 draft — 템플릿 관리(`recruitment-ujat-school` / `recruitment-ujat-volunteer`)와 동일 시드.
 * API·localStorage 영속화 연동 시 이 모듈만 교체하면 프로그램 상세 모집 탭에 반영된다.
 */

import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { normalizeWritingFormDraft, type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export const UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID = 'recruitment-ujat-school' as const
export const UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID = 'recruitment-ujat-volunteer' as const

export function getUjatRecruitInstitutionDraft(): WritingFormDraft {
  return normalizeWritingFormDraft(createUjatRecruitFormInstitutionDraft())
}

export function getUjatRecruitVolunteerDraft(): WritingFormDraft {
  return normalizeWritingFormDraft(createUjatRecruitFormVolunteerDraft())
}
