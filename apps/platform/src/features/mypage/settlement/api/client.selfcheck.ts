import assert from 'node:assert/strict'
import { mapSettlementOverviewStatus } from './client.ts'

assert.equal(
  mapSettlementOverviewStatus({ status: 'SUBMITTED' }),
  'waiting_confirm',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'CONFIRMED' }),
  'confirmed',
)
assert.equal(
  mapSettlementOverviewStatus({ paymentStatus: 'PAID' }),
  'paid',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'CORRECTION_REQUESTED' }),
  'correction_requested',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'REAPPLICATION' }),
  'reapplied',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'REJECTED' }),
  'rejected',
)
assert.equal(mapSettlementOverviewStatus({ status: 'UNKNOWN_XYZ' }), null)

console.log('settlement api client.selfcheck: ok')
