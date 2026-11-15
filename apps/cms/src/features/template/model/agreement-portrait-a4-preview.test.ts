import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_PORTRAIT_A4_SECTION_GAP_PX,
} from '@/features/template/model/agreement-portrait-a4-preview'

describe('agreement-portrait A4 preview', () => {
  it('scopes document preview CSS to the agreement-portrait body class', () => {
    expect(AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME).toBe(
      'form-document-preview-body--agreement-portrait'
    )
  })

  it('uses the 40px section gap from design 5767:42795', () => {
    expect(AGREEMENT_PORTRAIT_A4_SECTION_GAP_PX).toBe(40)
  })
})
