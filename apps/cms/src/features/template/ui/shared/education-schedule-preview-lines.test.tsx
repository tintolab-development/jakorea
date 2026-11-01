// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EducationSchedulePreviewLines } from './education-schedule-preview-lines'

afterEach(() => cleanup())

describe('EducationSchedulePreviewLines', () => {
  it('shows lines by date·time and removes by the original saved index', () => {
    const onRemove = vi.fn()
    const lines = ['2027.11.10(수) 23:00 ~ 23:50', '2027.11.10(수) 09:00 ~ 10:00']
    const { container, getAllByRole } = render(
      <EducationSchedulePreviewLines lines={lines} onRemove={onRemove} lockStartedLines={false} />
    )
    const texts = Array.from(
      container.querySelectorAll('.education-schedule-preview-lines__item .detail-info-form--text')
    ).map(node => node.textContent ?? '')
    expect(texts).toHaveLength(2)
    expect(texts[0]).toContain('09:00')
    expect(texts[1]).toContain('23:00')
    fireEvent.click(getAllByRole('button')[0]!)
    expect(onRemove).toHaveBeenCalledWith(1)
  })
})
