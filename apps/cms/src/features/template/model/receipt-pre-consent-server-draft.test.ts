import { describe, expect, it } from 'vitest'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { createReceiptPreConsentDraft } from '@/features/template/model/receipt-pre-consent-draft'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'

/** 서버 schemaJson이 빈 문자열 필드를 빼거나 null로 내려주는 경우 */
function dropEmptyStrings(value: unknown, mode: 'drop' | 'null'): unknown {
  if (Array.isArray(value)) return value.map(v => dropEmptyStrings(v, mode))
  if (value != null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value)) {
      if (v === '') {
        if (mode === 'null') out[key] = null
        continue
      }
      out[key] = dropEmptyStrings(v, mode)
    }
    return out
  }
  return value
}

describe('영수증 사전 동의서 — 서버 저장본 문자열 필드 누락 (QA 261113 #29)', () => {
  for (const mode of ['drop', 'null'] as const) {
    it(`빈 문자열 필드가 ${mode === 'drop' ? '빠져도' : 'null이어도'} 우측 단락 목록 제목을 만든다`, () => {
      const serverDraft = dropEmptyStrings(createReceiptPreConsentDraft(), mode) as WritingFormDraft
      const draft = normalizeWritingFormDraft(serverDraft)
      for (const paragraph of draft.paragraphs) {
        expect(typeof paragraph.paragraphTitle).toBe('string')
        expect(typeof paragraph.paragraphDescription).toBe('string')
        expect(() =>
          getFormNavDisplayLine(draft.paragraphs, paragraph, draft.formSettings.titleNumbering)
        ).not.toThrow()
      }
    })
  }
})
