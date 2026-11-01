import assert from 'node:assert/strict'
import { mapPortalDashboardStats } from './dashboard-stats.ts'

const endedStats = mapPortalDashboardStats({
  submitted: 0,
  approved: 1,
  inProgress: 1,
  completed: 1,
  giveUp: 1,
  rejected: 1,
  cancelled: 0,
  ended: 3,
})
assert.equal(endedStats.applied, 1)
assert.equal(endedStats.inProgress, 1)
assert.equal(endedStats.completed, 3)

const missingEnded = mapPortalDashboardStats({
  completed: 1,
  giveUp: 1,
  rejected: 1,
  cancelled: 1,
})
assert.equal(missingEnded.completed, 0)

console.log('mypage home dashboard-stats.selfcheck: ok')
