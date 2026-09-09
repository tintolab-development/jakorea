import { describe, expect, it } from 'vitest'
import {
  applyAtomicMailVariableDeletion,
  findMailVariableRanges,
  insertMailVariableInText,
  jumpCaretAcrossMailVariableAtom,
  resolveInsertOutsideMailVariable,
  resolveTypingOutsideMailVariableAtom,
  snapCaretOutsideMailVariableAtom,
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
    const { next } = insertMailVariableInText(text, '프로그램명', 2, 2)
    expect(next).toBe('#{회원명}#{프로그램명}')
  })
})

describe('findMailVariableRanges', () => {
  it('finds adjacent tokens without treating them as nested', () => {
    expect(findMailVariableRanges('#{회원명}#{프로그램명}')).toEqual([
      { from: 0, to: 6 },
      { from: 6, to: 14 },
    ])
  })
})

describe('snapCaretOutsideMailVariableAtom', () => {
  it('moves caret inside a token to the nearer edge', () => {
    const text = 'a#{회원명}b'
    expect(snapCaretOutsideMailVariableAtom(text, text.indexOf('원'))).toBe(1)
    expect(snapCaretOutsideMailVariableAtom(text, text.indexOf('명'))).toBe(7)
  })
})

describe('applyAtomicMailVariableDeletion', () => {
  it('deletes the whole token on backspace at token end', () => {
    const text = '안녕 #{회원명}님'
    const caret = '안녕 #{회원명}'.length
    expect(applyAtomicMailVariableDeletion(text, caret, caret, 'backward')).toEqual({
      next: '안녕 님',
      caret: 3,
    })
  })

  it('deletes the whole token on delete at token start', () => {
    const text = '안녕 #{회원명}님'
    const caret = '안녕 '.length
    expect(applyAtomicMailVariableDeletion(text, caret, caret, 'forward')).toEqual({
      next: '안녕 님',
      caret: 3,
    })
  })

  it('deletes the enclosing token when caret is inside', () => {
    const text = '#{회원명}'
    expect(applyAtomicMailVariableDeletion(text, 2, 2, 'backward')).toEqual({
      next: '',
      caret: 0,
    })
  })

  it('expands partial selection to the full token', () => {
    const text = 'x#{회원명}y'
    const from = text.indexOf('회')
    const to = text.indexOf('원') + 1
    expect(applyAtomicMailVariableDeletion(text, from, to, 'backward')).toEqual({
      next: 'xy',
      caret: 1,
    })
  })

  it('returns null for plain character backspace', () => {
    expect(applyAtomicMailVariableDeletion('안녕', 2, 2, 'backward')).toBeNull()
  })
})

describe('jumpCaretAcrossMailVariableAtom', () => {
  it('skips a token with arrow keys', () => {
    const text = 'a#{회원명}b'
    expect(jumpCaretAcrossMailVariableAtom(text, 7, 'left')).toBe(1)
    expect(jumpCaretAcrossMailVariableAtom(text, 1, 'right')).toBe(7)
  })
})

describe('resolveTypingOutsideMailVariableAtom', () => {
  it('moves typing caret to the end of an enclosing token', () => {
    const text = '#{회원명}'
    expect(resolveTypingOutsideMailVariableAtom(text, 2, 2)).toEqual({ from: 6, to: 6 })
  })
})
