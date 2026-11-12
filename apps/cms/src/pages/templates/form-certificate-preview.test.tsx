/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CERTIFICATE_SERIAL_PLACEHOLDER } from '@/features/program/shared/lib/certificate-serial'
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
    expect(sampleMark(container)?.textContent).toBe('SAMPLE')
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
