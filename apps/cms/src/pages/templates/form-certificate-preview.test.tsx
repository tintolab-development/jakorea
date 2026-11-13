/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CERTIFICATE_SERIAL_PLACEHOLDER } from '@/features/program/shared/lib/certificate-serial'
import {
  ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT,
  resolveCertificateParticipantLayout,
  resolveCertificateVariableChips,
} from '@/features/template/lib/certificate-participant-layout'
import { FormCertificatePreview } from './form-certificate-preview'

function sampleMark(container: HTMLElement) {
  return container.querySelector('[data-certificate-sample]')
}

function serialText(container: HTMLElement) {
  return container.querySelector('[data-certificate-serial="text"]')?.textContent
}

describe('FormCertificatePreview SAMPLE mark', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows SAMPLE and the fake placeholder number in the 양식 관리 sample preview', () => {
    const { container } = render(<FormCertificatePreview showSampleWatermark />)
    expect(sampleMark(container)?.textContent).toBe('견본(SAMPLE)')
    expect(serialText(container)).toBe(CERTIFICATE_SERIAL_PLACEHOLDER)
  })

  it('does not render SAMPLE when an issued serial is captured for the PDF', () => {
    const { container } = render(
      <FormCertificatePreview showSampleWatermark serialNumber="26-JA-00017" />
    )
    expect(sampleMark(container)).toBeNull()
    expect(serialText(container)).toBe('26-JA-00017')
  })

  it('does not render SAMPLE unless the sample preview opts in', () => {
    const { container } = render(<FormCertificatePreview />)
    expect(sampleMark(container)).toBeNull()
  })
})

describe('FormCertificatePreview 변수 칩(템플릿 관리 편집 캔버스)', () => {
  afterEach(() => {
    cleanup()
  })

  function chipTexts(container: HTMLElement, kind: string) {
    return [...container.querySelectorAll(`[data-certificate-variable-chip="${kind}"]`)].map(
      el => el.textContent
    )
  }

  it('칩을 넘기면 값 대신 @성명 등과 @발급일자를 그린다', () => {
    const { container } = render(
      <FormCertificatePreview
        participantInfo={'홍길동\n2009.09.15'}
        variableChips={resolveCertificateVariableChips('document-5')}
        participantLayout={ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT}
      />
    )
    expect(chipTexts(container, 'participant')).toEqual([
      '@성명',
      '@생년월일',
      '@소속처',
      '@프로그램명',
      '@프로그램 참여일 ~ @프로그램 종료일',
      '기관 및 학교 제출용',
    ])
    expect(chipTexts(container, 'issue-date')).toEqual(['@발급일자'])
    expect(container.textContent).not.toContain('홍길동')
    expect(container.querySelector('time')).toBeNull()
  })

  it('칩을 넘기지 않으면(발급 PDF·미리보기 팝업) 실제 값과 발급일을 그린다', () => {
    const { container } = render(<FormCertificatePreview participantInfo="홍길동" />)
    expect(container.querySelector('[data-certificate-variable-chip]')).toBeNull()
    expect(container.textContent).toContain('홍길동')
    expect(container.querySelector('time')).not.toBeNull()
  })
})

describe('FormCertificatePreview 참여자 라벨', () => {
  afterEach(() => {
    cleanup()
  })

  function labelTexts(container: HTMLElement) {
    return [...container.querySelectorAll('.form-certificate-preview__label-text')].map(
      el => el.textContent
    )
  }

  it.each([
    ['document-3', '프로그램 기간'],
    ['document-participation-certificate', '참여기간'],
    ['document-4', '활동기간'],
    ['document-5', '활동기간'],
  ])('%s 기본 배경에서도 라벨을 글자로 그린다 — 기간 줄 「%s」', (code, periodLabel) => {
    const { container } = render(
      <FormCertificatePreview participantLayout={resolveCertificateParticipantLayout(code)} />
    )
    expect(labelTexts(container)).toEqual([
      '성명',
      '생년월일',
      '소속',
      '프로그램명',
      periodLabel,
      '발급목적',
    ])
  })

  it('업로드한 배경에서도 같은 라벨을 그린다', () => {
    const { container } = render(
      <FormCertificatePreview
        certificateBackgroundPreviewSrc="blob:custom-bg"
        participantLayout={resolveCertificateParticipantLayout('document-3')}
      />
    )
    expect(labelTexts(container)[4]).toBe('프로그램 기간')
  })

  it('띄어쓰기 있는 라벨은 글자를 벌리지 않는다(시안 「프로그램 기간」)', () => {
    const { container } = render(
      <FormCertificatePreview
        participantLayout={resolveCertificateParticipantLayout('document-3')}
      />
    )
    const labels = [...container.querySelectorAll('.form-certificate-preview__label-text')]
    expect(labels[4]?.classList.contains('form-certificate-preview__label-text--natural')).toBe(
      true
    )
    expect(labels[4]?.querySelector('.form-certificate-preview__label-char')).toBeNull()
    expect(labels[3]?.querySelectorAll('.form-certificate-preview__label-char')).toHaveLength(5)
  })

  it('줄을 숨기면 라벨도 함께 숨는다', () => {
    const { container } = render(
      <FormCertificatePreview
        participantLayout={resolveCertificateParticipantLayout(
          'document-participation-certificate'
        )}
        participantRowVisibility={[true, false, true, true, true, true]}
      />
    )
    expect(labelTexts(container)).toEqual(['성명', '소속', '프로그램명', '참여기간', '발급목적'])
  })
})
