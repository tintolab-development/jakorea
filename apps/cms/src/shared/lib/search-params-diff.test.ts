import { describe, it, expect } from 'vitest'
import {
  applySearchParamUpdates,
  nextSearchParamsIfChanged,
  searchWithUpdatesDiffersFromLocation,
} from './search-params-diff'

describe('applySearchParamUpdates', () => {
  it('빈 값·undefined는 삭제로 처리한다', () => {
    expect(applySearchParamUpdates('?a=1&b=2', { b: undefined })).toBe('a=1')
    expect(applySearchParamUpdates('?a=1&b=2', { b: '' })).toBe('a=1')
    expect(applySearchParamUpdates('?a=1&b=2', { b: 'undefined' })).toBe('a=1')
  })

  it('기존 키는 자리를 유지하며 값만 바꾼다', () => {
    expect(applySearchParamUpdates('?a=1&b=2', { a: '9' })).toBe('a=9&b=2')
  })
})

describe('searchWithUpdatesDiffersFromLocation', () => {
  it('canonical id가 같으면 replace를 생략할 수 있다', () => {
    const search = '?kind=all&id=mock-md-individual-171001&lnb=detail-info'
    expect(
      searchWithUpdatesDiffersFromLocation(
        { id: 'mock-md-individual-171001', lnb: 'detail-info', programsChild: undefined },
        search
      )
    ).toBe(false)
  })

  it('canonical id가 다르면 쓰기가 필요하다', () => {
    const search = '?kind=all&id=410bc373-uuid&lnb=detail-info'
    expect(
      searchWithUpdatesDiffersFromLocation(
        { id: 'admin-account-850007', lnb: 'detail-info' },
        search
      )
    ).toBe(true)
  })

  it('삭제 대상 파라미터가 남아 있으면 쓰기가 필요하다', () => {
    expect(
      searchWithUpdatesDiffersFromLocation(
        { programsChild: undefined },
        '?id=x&programsChild=enrollment'
      )
    ).toBe(true)
  })
})

describe('nextSearchParamsIfChanged', () => {
  it('recipe가 identity면 쓰기를 생략한다', () => {
    expect(nextSearchParamsIfChanged(prev => prev, '?status=in_progress&title=연수')).toBeNull()
  })

  it('주소창에 programId가 있으면 stale prev 반환도 쓰기로 취급하지 않는다', () => {
    expect(
      nextSearchParamsIfChanged(prev => {
        if (!prev.get('programId')) return prev
        return prev
      }, '?status=in_progress&programId=186001&lnb=info&tab=info')
    ).toBeNull()
  })

  it('목록 필터를 유지한 채 programId를 추가하면 next를 반환한다', () => {
    const next = nextSearchParamsIfChanged(prev => {
      const patched = new URLSearchParams(prev)
      patched.set('programId', '186001')
      patched.set('lnb', 'info')
      patched.set('tab', 'info')
      return patched
    }, '?status=in_progress&title=연수')

    expect(next?.get('programId')).toBe('186001')
    expect(next?.get('status')).toBe('in_progress')
    expect(next?.get('title')).toBe('연수')
  })
})
