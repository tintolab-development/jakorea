/**
 * UJAT 모집 폼 draft — 템플릿 관리와 동일 시드 + remote/메모리 스냅샷.
 */

import {
  hydrateAllUjatRecruitTemplatesFromRemote,
  loadUjatRecruitInstitutionTemplateSave,
  loadUjatRecruitVolunteerTemplateSave,
  UJAT_RECRUIT_TEMPLATE_CHANGED_EVENT,
} from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { normalizeWritingFormDraft, type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export const UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID = 'recruitment-ujat-school' as const
export const UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID = 'recruitment-ujat-volunteer' as const

export { hydrateAllUjatRecruitTemplatesFromRemote, UJAT_RECRUIT_TEMPLATE_CHANGED_EVENT }

export function getUjatRecruitInstitutionDraft(): WritingFormDraft {
  const saved = loadUjatRecruitInstitutionTemplateSave()
  if (saved?.draft) return normalizeWritingFormDraft(saved.draft)
  return normalizeWritingFormDraft(createUjatRecruitFormInstitutionDraft())
}

export function getUjatRecruitVolunteerDraft(): WritingFormDraft {
  const saved = loadUjatRecruitVolunteerTemplateSave()
  if (saved?.draft) return normalizeWritingFormDraft(saved.draft)
  return normalizeWritingFormDraft(createUjatRecruitFormVolunteerDraft())
}
