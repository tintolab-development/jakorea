import { describe, expect, it } from 'vitest'
import {
  defaultParticipantApplicationTab,
  isParticipantTabValid,
} from '@/features/program/general/lib/progress-tabs'

describe('participant applications screening routing', () => {
  it('면접 없음 프로그램은 tab=main만 유효하다', () => {
    expect(isParticipantTabValid('main', false)).toBe(true)
    expect(isParticipantTabValid('part_doc1', false)).toBe(false)
    expect(defaultParticipantApplicationTab(false)).toBe('main')
  })

  it('면접 있음 프로그램은 part_* 탭만 유효하다', () => {
    expect(isParticipantTabValid('part_doc1', true)).toBe(true)
    expect(isParticipantTabValid('part_doc_passed', true)).toBe(true)
    expect(isParticipantTabValid('part_interview2', true)).toBe(true)
    expect(isParticipantTabValid('main', true)).toBe(false)
    expect(defaultParticipantApplicationTab(true)).toBe('part_doc1')
  })
})
