import { describe, expect, it } from 'vitest'
import {
  buildSponsorBulkDeleteMessageLines,
  buildSponsorDeleteMessageLines,
} from './sponsor-delete-guide-messages'

describe('buildSponsorDeleteMessageLines', () => {
  it('단건 — 후원사 삭제 안내 카피', () => {
    expect(buildSponsorDeleteMessageLines(['삼성전자'])).toEqual([
      '[삼성전자]를 후원사에서 삭제하시겠습니까?',
      '삭제 시 후원금을 비롯한 모든 프로그램 관련 정보가 삭제됩니다.',
      '삭제된 정보는 되돌릴 수 없습니다.',
    ])
  })
})

describe('buildSponsorBulkDeleteMessageLines', () => {
  it('일괄 — 1줄 이후 후원사 전용 2·3줄', () => {
    const lines = buildSponsorBulkDeleteMessageLines(3)
    expect(lines[0]).toBe('선택한 3개의 후원사를 모두 삭제하시겠습니까?')
    expect(lines[1]).toBe('삭제 시 후원금을 비롯한 모든 프로그램 관련 정보가 삭제됩니다.')
    expect(lines[2]).toBe('삭제된 정보는 되돌릴 수 없습니다.')
  })
})
