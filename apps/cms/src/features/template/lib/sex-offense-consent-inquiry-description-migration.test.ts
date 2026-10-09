import { describe, expect, it } from 'vitest'
import {
  createProgramApplicationFormInstitutionDraft,
  migrateProgramApplicationFormInstitutionParagraphs,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
} from '@/features/template/model/program-application-form-institution-draft'
import {
  createProgramApplicationFormEconomyDraft,
  migrateProgramApplicationFormEconomyParagraphs,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
} from '@/features/template/model/program-application-form-economy-draft'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  LEGACY_INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_DESCRIPTIONS,
} from '@/features/template/lib/institution-sex-offense-consent-field-definitions'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

const LEGACY_DESCRIPTION = LEGACY_INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_DESCRIPTIONS[0]

function withDescription(draft: WritingFormDraft, id: string, description: string) {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(p =>
      p.id === id ? { ...p, paragraphDescription: description } : p
    ),
  }
}

function descriptionOf(draft: WritingFormDraft, id: string) {
  return draft.paragraphs.find(p => p.id === id)?.paragraphDescription
}

describe('성범죄 경력 조회 동의서 조회 방식 단락 설명 migration', () => {
  it('일반 기관 신청 폼 — 저장본의 이전 설명을 현재 설명으로 교체', () => {
    const id = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod
    const legacy = withDescription(createProgramApplicationFormInstitutionDraft(), id, LEGACY_DESCRIPTION)
    const migrated = migrateProgramApplicationFormInstitutionParagraphs(legacy)
    expect(descriptionOf(migrated, id)).toBe(INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description)
  })

  it('1사1교 신청 폼 — 저장본의 이전 설명을 현재 설명으로 교체', () => {
    const id = PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod
    const legacy = withDescription(createProgramApplicationFormEconomyDraft(), id, LEGACY_DESCRIPTION)
    const migrated = migrateProgramApplicationFormEconomyParagraphs(legacy)
    expect(descriptionOf(migrated, id)).toBe(INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description)
  })

  it('현재 설명이면 draft 참조를 유지', () => {
    const draft = createProgramApplicationFormInstitutionDraft()
    expect(migrateProgramApplicationFormInstitutionParagraphs(draft).paragraphs).toEqual(draft.paragraphs)
  })

  it('사용자가 수정한 설명·제목은 유지', () => {
    const id = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod
    const draft = createProgramApplicationFormInstitutionDraft()
    const customized = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === id
          ? {
              ...p,
              paragraphTitle: '맞춤 조회 방식 안내',
              paragraphDescription: '기관 운영 정책에 맞는 설명',
            }
          : p
      ),
    }
    const migrated = migrateProgramApplicationFormInstitutionParagraphs(customized)
    const paragraph = migrated.paragraphs.find(p => p.id === id)
    expect(paragraph?.paragraphTitle).toBe('맞춤 조회 방식 안내')
    expect(paragraph?.paragraphDescription).toBe('기관 운영 정책에 맞는 설명')
  })
})
