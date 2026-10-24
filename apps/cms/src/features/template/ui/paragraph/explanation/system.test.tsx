// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import type { SystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
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

const paymentDateParagraph: SystemParagraph = {
  id: 'payment-statement-pre-consent-seed-mid-date',
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: true,
  paragraphTitle: '날짜 유형',
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

  it('지급조서 A4 템플릿 미리보기(document, now 없음)는 YYYY년 MM월 DD일', () => {
    const { getByText } = render(
      <ExplanationSystem
        paragraph={paymentDateParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
      />
    )
    expect(getByText('YYYY년 MM월 DD일')).toBeTruthy()
  })

  it('지급조서 제출 문서(document + now)는 실제 날짜를 표시한다', () => {
    const { getByText } = render(
      <ExplanationSystem
        paragraph={paymentDateParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
        now={new Date('2026-10-23T00:00:00')}
      />
    )
    expect(getByText('2026년 10월 23일')).toBeTruthy()
  })

  it('초상권 동의서 A4 템플릿 미리보기(document, now 없음)는 YYYY년 MM월 DD일', () => {
    const portraitDateParagraph: SystemParagraph = {
      id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
      kind: 'description',
      variant: 'system',
      systemPreset: 'agreement_date',
      requiredMark: true,
      paragraphTitle: '날짜 유형',
      paragraphDescription: '',
      participatesInTitleNumbering: false,
    }
    const { getByText } = render(
      <ExplanationSystem
        paragraph={portraitDateParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
      />
    )
    expect(getByText('YYYY년 MM월 DD일')).toBeTruthy()
  })

  it('행정정보 사전동의서 A4 템플릿 미리보기(document, now 없음)는 YYYY년 MM월 DD일', () => {
    const noticeDateParagraph: SystemParagraph = {
      id: AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
      kind: 'description',
      variant: 'system',
      systemPreset: 'agreement_date',
      requiredMark: true,
      paragraphTitle: '날짜 유형',
      paragraphDescription: '',
      participatesInTitleNumbering: false,
    }
    const { getByText } = render(
      <ExplanationSystem
        paragraph={noticeDateParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
      />
    )
    expect(getByText('YYYY년 MM월 DD일')).toBeTruthy()
  })

  it('교육진행자 서약서 A4 템플릿 미리보기(document, now 없음)는 YYYY년 MM월 DD일', () => {
    const pledgeDateParagraph: SystemParagraph = {
      id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
      kind: 'description',
      variant: 'system',
      systemPreset: 'agreement_date',
      requiredMark: true,
      paragraphTitle: '날짜 유형',
      paragraphDescription: '',
      participatesInTitleNumbering: false,
    }
    const { getByText } = render(
      <ExplanationSystem
        paragraph={pledgeDateParagraph}
        onChange={() => {}}
        isEditMode={false}
        displayMode="document"
      />
    )
    expect(getByText('YYYY년 MM월 DD일')).toBeTruthy()
  })
})
