import { describe, expect, it } from 'vitest'
import { notificationDeliveryDetailView } from './notification-delivery-detail-cache'

describe('notificationDeliveryDetailView', () => {
  it('uses the detail GET row only', () => {
    expect(notificationDeliveryDetailView({ id: 'raw' }, false)).toEqual({ id: 'raw' })
  })

  it('does not fall back to a list row on 403/5xx', () => {
    expect(notificationDeliveryDetailView(undefined, true)).toBeNull()
    expect(notificationDeliveryDetailView({ id: 'stale-raw' }, true)).toBeNull()
  })
})
