/**
 * Open a native file picker from a user-initiated action.
 *
 * Do not call `showPicker()` on a visually hidden `<input type="file">`.
 * Chrome can return from `showPicker` without throwing and without opening
 * a dialog, which skips the `click()` fallback and looks like a dead button
 * on deployed HTTPS builds.
 *
 * Prefer overlaying the file input on the trigger so the user click hits the
 * input directly. This helper is only the keyboard / non-overlay fallback.
 */
export function openFilePicker(input: HTMLInputElement | null): void {
  if (!input || input.disabled) return
  input.click()
}
