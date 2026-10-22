import { describe, expect, it, vi } from 'vitest'
import { openFilePicker } from './open-file-picker'

describe('openFilePicker', () => {
  it('does not call showPicker and opens with click', () => {
    const click = vi.fn()
    const showPicker = vi.fn()
    const input = { disabled: false, click, showPicker } as unknown as HTMLInputElement

    openFilePicker(input)

    expect(showPicker).not.toHaveBeenCalled()
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('ignores a missing or disabled input', () => {
    const click = vi.fn()
    openFilePicker(null)
    openFilePicker({ disabled: true, click } as unknown as HTMLInputElement)
    expect(click).not.toHaveBeenCalled()
  })
})
