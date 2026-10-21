// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import type { SystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ExplanationSystem } from './system'

const signatureParagraph: SystemParagraph = {
  id: 'agreement-portrait-system-signature',
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: true,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

describe('ExplanationSystem document signature', () => {
  afterEach(cleanup)

  it('document 모드에서 이미지 src가 있으면 전자서명을 그린다', () => {
    const { getByAltText, queryByText } = render(
      <ExplanationSystem
        paragraph={signatureParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
        participantName="홍길동"
        signatureImageSrc="blob:mock-signature"
      />
    )
    expect(getByAltText('전자서명')).toHaveAttribute('src', 'blob:mock-signature')
    expect(queryByText('(서명)')).toBeNull()
  })

  it('document 모드에서 이미지가 없으면 (서명) 표시', () => {
    const { getByText, queryByAltText } = render(
      <ExplanationSystem
        paragraph={signatureParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
        participantName="홍길동"
      />
    )
    expect(getByText('(서명)')).toBeTruthy()
    expect(queryByAltText('전자서명')).toBeNull()
  })
})
