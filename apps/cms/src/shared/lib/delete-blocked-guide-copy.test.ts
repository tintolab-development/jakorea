import { describe, expect, it } from 'vitest'
import {
  buildDeleteBlockedBulkLead,
  buildDeleteBlockedGuideTitle,
  resolveDeleteBlockedGuideCopy,
} from './delete-blocked-guide-copy'

describe('delete-blocked-guide-copy', () => {
  it('단건 — 사유 1줄만', () => {
    expect(
      resolveDeleteBlockedGuideCopy({
        entityLabel: '교재',
        reasonLine: '프로그램에서 사용 중인 교재는 삭제할 수 없습니다.',
        selectedCount: 1,
      })
    ).toEqual({
      title: '교재 삭제 불가 안내',
      description: '프로그램에서 사용 중인 교재는 삭제할 수 없습니다.',
    })
  })

  it('일괄 — lead + 사유', () => {
    expect(
      resolveDeleteBlockedGuideCopy({
        entityLabel: '세부 프로그램',
        reasonLine: '프로그램에서 사용 중인 세부 프로그램은 삭제할 수 없습니다.',
        selectedCount: 3,
      })
    ).toEqual({
      title: '세부 프로그램 일괄 삭제 불가 안내',
      description:
        '**선택한 3개의 항목** 중 삭제가 불가한 항목이 포함되어 있습니다.\n프로그램에서 사용 중인 세부 프로그램은 삭제할 수 없습니다.',
    })
  })

  it('buildDeleteBlockedBulkLead', () => {
    expect(buildDeleteBlockedBulkLead(2)).toBe(
      '**선택한 2개의 항목** 중 삭제가 불가한 항목이 포함되어 있습니다.'
    )
  })

  it('buildDeleteBlockedGuideTitle', () => {
    expect(buildDeleteBlockedGuideTitle('후원사', false)).toBe('후원사 삭제 불가 안내')
    expect(buildDeleteBlockedGuideTitle('후원사', true)).toBe('후원사 일괄 삭제 불가 안내')
  })
})
