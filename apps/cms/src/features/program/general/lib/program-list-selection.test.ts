import { describe, expect, it } from 'vitest'
import { canBulkDeletePrograms } from './program-list-selection'

describe('canBulkDeletePrograms', () => {
  it('목록에서 선택 행이 있을 때만 활성화한다', () => {
    expect(canBulkDeletePrograms('list', 1)).toBe(true)
    expect(canBulkDeletePrograms('list', 0)).toBe(false)
  })

  it('캘린더에서는 선택 상태와 무관하게 비활성화한다', () => {
    expect(canBulkDeletePrograms('calendar', 1)).toBe(false)
    expect(canBulkDeletePrograms('calendar', 0)).toBe(false)
  })
})
