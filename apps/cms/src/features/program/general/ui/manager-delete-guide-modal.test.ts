import { describe, expect, it } from 'vitest'
import {
  buildManagerMessageLines,
  resolveManagerDeleteModalTitle,
} from './manager-delete-guide-modal'

const IMPACT_LINE = '삭제 시 해당 프로그램의 접근 권한을 모두 잃게 됩니다.'

describe('resolveManagerDeleteModalTitle', () => {
  it('단건은 프로그램 담당자 삭제 안내', () => {
    expect(resolveManagerDeleteModalTitle(1)).toBe('프로그램 담당자 삭제 안내')
  })

  it('2명 이상은 프로그램 담당자 일괄 삭제 안내', () => {
    expect(resolveManagerDeleteModalTitle(2)).toBe('프로그램 담당자 일괄 삭제 안내')
    expect(resolveManagerDeleteModalTitle(5)).toBe('프로그램 담당자 일괄 삭제 안내')
  })
})

describe('buildManagerMessageLines', () => {
  it('단건 — [이름] 님을 프로그램 담당자 목록에서 삭제', () => {
    expect(buildManagerMessageLines(['김제이'])).toEqual([
      '[김제이] 님을 프로그램 담당자 목록에서 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })

  it('일괄 — [이름] 님 외 N명', () => {
    expect(buildManagerMessageLines(['김제이', '이담당', '박매니저'])).toEqual([
      '[김제이] 님 외 2명을 프로그램 담당자 목록에서 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })

  it('빈 목록은 빈 문구', () => {
    expect(buildManagerMessageLines([])).toEqual([])
  })
})
