import { describe, expect, it } from 'vitest'
import {
  extensionJsonToExtensionPayload,
  extensionPayloadToExtensionJson,
  schemaJsonToWritingFormDraft,
  writingFormDraftToSchemaJson,
} from '@/features/template/api/adapters/form-template-draft-adapters'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

describe('form-template-draft-adapters', () => {
  it('round-trips schemaJson for registration-general seed draft', () => {
    const draft = createProgramRegistrationDraft('general')
    const restored = schemaJsonToWritingFormDraft(writingFormDraftToSchemaJson(draft))
    expect(restored?.paragraphs).toHaveLength(6)
    expect(restored?.paragraphs[0]?.id).toBe('program-registration-seed-basic-info')
  })

  it('사용자 양식의 단락 순서와 타이틀 번호를 schemaJson에 보존한다', () => {
    const draft = createProgramRegistrationDraft('general')
    const reordered = {
      ...draft,
      formSettings: { ...draft.formSettings, titleNumbering: 'alpha' as const },
      paragraphs: [...draft.paragraphs].reverse(),
    }

    const restored = schemaJsonToWritingFormDraft(writingFormDraftToSchemaJson(reordered))

    expect(restored?.formSettings.titleNumbering).toBe('alpha')
    expect(restored?.paragraphs.map(paragraph => paragraph.id)).toEqual(
      reordered.paragraphs.map(paragraph => paragraph.id)
    )
  })

  it('parses extensionJson editorState', () => {
    const extensionJson = JSON.stringify({
      overlay: { limit: 1 },
      editorState: { programType: 'curriculum' },
      uiState: {},
    })
    const payload = extensionJsonToExtensionPayload(extensionJson)
    expect(payload?.overlay).toEqual({ limit: 1 })
    expect(payload?.editorState).toEqual({ programType: 'curriculum' })
  })

  it('serializes extension payload to extensionJson string', () => {
    const json = extensionPayloadToExtensionJson({
      editorState: { sessionRoundType: 'single' },
    })
    const payload = extensionJsonToExtensionPayload(json)
    expect(payload?.editorState).toEqual({ sessionRoundType: 'single' })
    expect(payload?.overlay).toEqual({})
  })
})
