/**
 * Open a native file picker from a user-initiated action.
 *
 * `showPicker` is the explicit file-picker API. Older browsers and browsers
 * without that API fall back to the widely supported `HTMLInputElement.click`.
 * Some browsers can reject `showPicker` when the user activation is not
 * available, so the fallback must remain in the same event handler.
 */
export function openFilePicker(input: HTMLInputElement | null): void {
  if (!input || input.disabled) return

  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
      return
    } catch {
      // Fall back to click for browsers that reject showPicker activation.
    }
  }

  input.click()
}
