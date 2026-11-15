import { describe, expect, it } from 'vitest'
import { resolveModalityFromKey } from './pointer-focus-modality'

describe('resolveModalityFromKey', () => {
  it('Tab·방향키 등 포커스 이동 키는 키보드 모드로 바꾼다', () => {
    for (const key of ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
      expect(resolveModalityFromKey(key)).toBe('keyboard')
    }
  })

  it('Shift·Ctrl·Alt·Meta 단독 입력은 모드를 바꾸지 않는다 (Shift+스크롤 스트로크 방지)', () => {
    for (const key of ['Shift', 'Control', 'Alt', 'Meta']) {
      expect(resolveModalityFromKey(key)).toBeNull()
    }
  })
})
