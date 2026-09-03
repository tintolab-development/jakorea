import { describe, expect, it } from 'vitest'
import { getPdfAnnotationPreviewText } from './pdf-annotation-preview-text'

describe('getPdfAnnotationPreviewText', () => {
  it('reads Preview-style FreeText contents', () => {
    expect(getPdfAnnotationPreviewText({ contents: '홍길동' })).toBe('홍길동')
  })

  it('reads contentsObj when contents is empty', () => {
    expect(getPdfAnnotationPreviewText({ contents: '  ', contentsObj: { str: '작성값' } })).toBe(
      '작성값'
    )
  })

  it('reads contents when pdf.js returns { str }', () => {
    expect(getPdfAnnotationPreviewText({ contents: { str: 'HONG GILDONG FILLED' } })).toBe(
      'HONG GILDONG FILLED'
    )
  })

  it('reads AcroForm fieldValue', () => {
    expect(getPdfAnnotationPreviewText({ fieldValue: '동의' })).toBe('동의')
    expect(getPdfAnnotationPreviewText({ fieldValue: ['서울', '강남'] })).toBe('서울, 강남')
  })
})
