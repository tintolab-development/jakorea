import { describe, expect, it } from 'vitest'
import {
  findMailVariableRanges,
  insertMailVariableInText,
  resolveInsertOutsideMailVariable,
} from './insert-variable'

describe('resolveInsertOutsideMailVariable', () => {
  it('keeps caret after a complete token', () => {
    expect(resolveInsertOutsideMailVariable('안녕 #{회원명}님', 9, 9)).toEqual({
      from: 9,
      to: 9,
    })
  })

  it('moves caret out of an existing token instead of nesting', () => {
    const text = '안녕 #{회원명}님'
    const inside = text.indexOf('원')
    expect(resolveInsertOutsideMailVariable(text, inside, inside)).toEqual({
      from: 9,
      to: 9,
    })
  })

  it('allows replacing a fully selected token', () => {
    expect(resolveInsertOutsideMailVariable('#{회원명}', 0, 6)).toEqual({
      from: 0,
      to: 6,
    })
  })
})

describe('insertMailVariableInText', () => {
  it('appends after the enclosing token when the caret is inside', () => {
    const text = '안녕 #{회원명}님'
    const inside = text.indexOf('원')
    const { next, caret } = insertMailVariableInText(text, '담당자명', inside, inside)
    expect(next).toBe('안녕 #{회원명}#{담당자명}님')
    expect(caret).toBe('안녕 #{회원명}#{담당자명}'.length)
  })

  it('does not split a token when inserting at the start of its interior', () => {
    const text = '#{회원명}'
    const { next } = insertMailVariableInText(text, '서비스명', 2, 2)
    expect(next).toBe('#{회원명}#{서비스명}')
  })
})

describe('findMailVariableRanges', () => {
  it('finds adjacent tokens without treating them as nested', () => {
    expect(findMailVariableRanges('#{회원명}#{서비스명}')).toEqual([
      { from: 0, to: 6 },
      { from: 6, to: 13 },
    ])
  })
})
