import { describe, expect, it } from 'vitest'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import {
  getStructureLockedPartialLockedBodyColumnIndexes,
  isStructureLockedPartialDisclaimerEdit,
  isStructureLockedPartialTextParagraph,
  resolveStructureLockedParagraphHint,
} from '@/features/template/lib/structure-locked-paragraph-hint'

describe('resolveStructureLockedParagraphHint', () => {
  it('시드 잠금 기본 안내 문구는 수정 및 삭제 순서를 쓴다', () => {
    expect(resolveStructureLockedParagraphHint('any-seed-paragraph')).toBe(
      '* 해당 단락은 수정 및 삭제가 불가합니다.'
    )
  })

  it('개인정보·제3자 동의 시드는 partial 안내를 쓴다', () => {
    expect(
      resolveStructureLockedParagraphHint(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent)
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
    expect(
      resolveStructureLockedParagraphHint(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection
      )
    ).toBe('* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.')
  })
})

describe('structure-locked partial text edit', () => {
  it('강사·1사1교·Gemini·UJAT·교육받은교사 개인정보·초상권은 partial 텍스트 수정 대상', () => {
    expect(
      isStructureLockedPartialTextParagraph(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent)
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialTextParagraph(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent
      )
    ).toBe(true)
  })

  it('개인정보·제3자만 하단 안내 partial 수정', () => {
    expect(
      isStructureLockedPartialDisclaimerEdit(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection
      )
    ).toBe(true)
    expect(
      isStructureLockedPartialDisclaimerEdit(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent
      )
    ).toBe(false)
  })

  it('보유기간(마지막 열)만 잠금 — 초상권은 전 열 개방', () => {
    expect([
      ...getStructureLockedPartialLockedBodyColumnIndexes(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
        3
      ),
    ]).toEqual([2])
    expect([
      ...getStructureLockedPartialLockedBodyColumnIndexes(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        4
      ),
    ]).toEqual([3])
    expect([
      ...getStructureLockedPartialLockedBodyColumnIndexes(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
        2
      ),
    ]).toEqual([])
  })
})

describe('structure-locked paragraph add policy', () => {
  function addDisabled(
    structureLocked: boolean,
    allowAddAfterStructureLockedParagraphs: boolean
  ): boolean {
    return structureLocked && !allowAddAfterStructureLockedParagraphs
  }

  it('등록·모집: 잠금 시드에서 단락 추가도 disabled', () => {
    expect(addDisabled(true, false)).toBe(true)
  })

  it('신청: 잠금 시드에서도 단락 추가 허용', () => {
    expect(addDisabled(true, true)).toBe(false)
  })

  it('비잠금 단락은 추가 가능', () => {
    expect(addDisabled(false, false)).toBe(false)
    expect(addDisabled(false, true)).toBe(false)
  })
})
