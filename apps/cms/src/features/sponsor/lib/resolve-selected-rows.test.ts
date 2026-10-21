import { describe, expect, it } from 'vitest'
import { resolveSelectedSponsorRows } from './resolve-selected-rows'

describe('resolveSelectedSponsorRows', () => {
  it('string/number 키를 같은 id로 매칭한다', () => {
    const rows = [{ id: '12' }, { id: '13' }]
    expect(resolveSelectedSponsorRows(rows, [12])).toEqual([rows[0]])
  })

  it('현재 페이지에 없어도 스냅샷에서 복원한다', () => {
    const snapshot = [{ id: '99' }]
    expect(resolveSelectedSponsorRows([], ['99'], snapshot)).toEqual(snapshot)
  })

  it('선택 키가 없으면 빈 배열이다', () => {
    expect(resolveSelectedSponsorRows([{ id: '1' }], [])).toEqual([])
  })
})
