import { describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import {
  getStructureLockedPartialLockedBodyColumnIndexes,
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
  })
})

describe('structure-locked partial text edit', () => {
  it('강사 개인정보 수집·이용은 partial 텍스트 수정 대상', () => {
    expect(
      isStructureLockedPartialTextParagraph(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection
      )
    ).toBe(true)
  })

  it('보유기간(마지막 열)만 잠금', () => {
    expect([...getStructureLockedPartialLockedBodyColumnIndexes(3)]).toEqual([2])
    expect([...getStructureLockedPartialLockedBodyColumnIndexes(4)]).toEqual([3])
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
