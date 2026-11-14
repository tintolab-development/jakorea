import { describe, expect, it } from 'vitest'
import { buildNamedDeleteGuideHeadline } from './named-delete-guide-headline'

describe('buildNamedDeleteGuideHeadline', () => {
  it('단건 — [이름] 교재를', () => {
    expect(
      buildNamedDeleteGuideHeadline({ entityLabel: '교재', names: ['경제 교실'], selectedCount: 1 })
    ).toBe('**[경제 교실]** 교재를 삭제하시겠습니까?')
  })

  it('일괄 — [이름] 외 N개의 세부 프로그램을', () => {
    expect(
      buildNamedDeleteGuideHeadline({
        entityLabel: '세부 프로그램',
        names: ['진로 탐색', '금융 교육', '창업 캠프'],
        selectedCount: 3,
      })
    ).toBe('**[진로 탐색] 외 2개**의 세부 프로그램을 삭제하시겠습니까?')
  })

  it('긴 이름은 말줄임', () => {
    expect(
      buildNamedDeleteGuideHeadline({
        entityLabel: '교재',
        names: ['가나다라마바사아자차카타파하가나다라마바'],
        selectedCount: 1,
      })
    ).toBe('**[가나다라마바사아자차카타파하가나다라...]** 교재를 삭제하시겠습니까?')
  })

  it('이름이 없으면 null', () => {
    expect(
      buildNamedDeleteGuideHeadline({ entityLabel: '교재', names: [' '], selectedCount: 2 })
    ).toBeNull()
  })
})
