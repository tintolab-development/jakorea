/**
 * 입력 방식(마우스·터치 / 키보드)을 `<html data-cms-input-modality>`에 기록한다.
 *
 * QA: 탭·항목을 마우스로 누른 뒤 Shift(+스크롤) 등 보조키를 누르면 브라우저가 키보드 사용으로 보고
 * `:focus-visible` 민트 포커스 링을 띄워 스트로크·번쩍임이 보였다.
 * 마우스로 누른 뒤에는 링을 숨기고(`index.css`), Tab·방향키 등 포커스 이동 키를 누를 때만 다시 보이게 한다.
 */

export const CMS_INPUT_MODALITY_ATTR = 'data-cms-input-modality'

export type CmsInputModality = 'pointer' | 'keyboard'

/** 포커스 이동·조작 키 — Shift·Ctrl·Alt·Meta 단독 입력은 포함하지 않는다. */
const KEYBOARD_NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])

export function resolveModalityFromKey(key: string): CmsInputModality | null {
  return KEYBOARD_NAVIGATION_KEYS.has(key) ? 'keyboard' : null
}

let installed = false

export function installPointerFocusModality(doc: Document | undefined = globalThis.document): void {
  if (installed || !doc?.documentElement) return
  installed = true
  const root = doc.documentElement
  const set = (modality: CmsInputModality) => {
    if (root.getAttribute(CMS_INPUT_MODALITY_ATTR) !== modality) {
      root.setAttribute(CMS_INPUT_MODALITY_ATTR, modality)
    }
  }
  doc.addEventListener('pointerdown', () => set('pointer'), { capture: true, passive: true })
  doc.addEventListener(
    'keydown',
    event => {
      const next = resolveModalityFromKey(event.key)
      if (next) set(next)
    },
    { capture: true, passive: true }
  )
}
