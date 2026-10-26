import { describe, expect, it } from 'vitest'
import { selectApprovedAlimtalkSendTemplates } from './alimtalk-template-service'

describe('selectApprovedAlimtalkSendTemplates', () => {
  it('AT-11 승인 상태가 없는 템플릿은 발송 후보에서 제외하고 승인 템플릿은 남긴다', () => {
    const selected = selectApprovedAlimtalkSendTemplates([
      { id: 'approved', approvalStatus: 'APPROVED' },
      { id: 'missing', approvalStatus: null },
      { id: 'omitted' },
      { id: 'pending', approvalStatus: 'PENDING' },
    ])
    expect(selected.map(item => item.id)).toEqual(['approved'])
  })
})
