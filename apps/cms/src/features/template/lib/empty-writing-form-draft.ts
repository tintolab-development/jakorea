import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

/** draft API 로드 전 placeholder — 잘못된 variant 시드가 한 프레임도 노출되지 않게 한다 */
export const EMPTY_WRITING_FORM_DRAFT: WritingFormDraft = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
})
