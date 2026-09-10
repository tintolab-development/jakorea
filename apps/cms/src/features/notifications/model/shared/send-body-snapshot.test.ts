import { describe, expect, it } from 'vitest'
import type { CreateRequest } from '@/shared/api/generated/notifications/schemas'
import { applyNotificationSendBodySnapshot } from './send-body-snapshot'

function emptyBody(): CreateRequest {
  return {
    batchName: 't',
    templateId: 1,
    recipients: [],
  }
}

describe('applyNotificationSendBodySnapshot', () => {
  it('attaches edited SMS body without mutating registered template path', () => {
    const body = emptyBody()
    applyNotificationSendBodySnapshot(body, {
      channel: 'SMS',
      title: '',
      content: '등록본문#{회원명}',
      baseline: { title: '', content: '등록본문' },
    })
    expect(body).toMatchObject({
      contentTemplate: '등록본문#{회원명}',
    })
    expect(body).not.toHaveProperty('titleTemplate')
  })

  it('omits fields when compose equals baseline', () => {
    const body = emptyBody()
    applyNotificationSendBodySnapshot(body, {
      channel: 'EMAIL',
      title: '제목',
      content: '<p>본문</p>',
      baseline: { title: '제목', content: '<p>본문</p>' },
    })
    expect(body).not.toHaveProperty('titleTemplate')
    expect(body).not.toHaveProperty('contentTemplate')
  })

  it('truncates LMS title to 40 chars', () => {
    const body = emptyBody()
    const long = '가'.repeat(50)
    applyNotificationSendBodySnapshot(body, {
      channel: 'SMS',
      title: long,
      content: '본문',
      baseline: { title: '', content: '' },
    })
    expect(body.titleTemplate).toHaveLength(40)
  })
})
