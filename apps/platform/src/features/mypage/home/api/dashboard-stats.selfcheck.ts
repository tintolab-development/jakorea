import assert from 'node:assert/strict'
import { mapPortalDashboardStats, readPortalDashboard } from './dashboard-stats.ts'

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
// approved는 inProgress와 겹치는 승인 원본 상태 건수 — 신청 카드에 더하지 않는다.
assert.equal(endedStats.applied, 0)
assert.equal(endedStats.inProgress, 1)
assert.equal(endedStats.completed, 3)

const missingEnded = mapPortalDashboardStats({
  completed: 1,
  giveUp: 1,
  rejected: 1,
  cancelled: 1,
})
assert.equal(missingEnded.completed, 0)

const sampleApplications = {
  submitted: 3,
  approved: 4,
  inProgress: 4,
  completed: 2,
  giveUp: 1,
  rejected: 1,
  cancelled: 0,
  ended: 4,
}
const sampleStats = mapPortalDashboardStats(sampleApplications)
assert.equal(sampleStats.applied, 3)
assert.equal(sampleStats.inProgress, 4)
assert.equal(sampleStats.completed, 4)

const nested = readPortalDashboard({
  success: true,
  data: {
    applications: sampleApplications,
    pendingActions: { surveysPending: 9 },
    upcomingSchedules: [{ eventId: 'x' }],
    recentNotices: [{ noticeId: 1 }],
    instructorRoleRequest: { status: 'APPROVED' },
  },
})
assert.deepEqual(nested, { applications: sampleApplications })

const root = readPortalDashboard({
  applications: sampleApplications,
  data: { applications: { submitted: 99, approved: 0, inProgress: 0, ended: 0 } },
})
assert.deepEqual(root.applications, sampleApplications)

assert.equal(Object.keys(nested).join(','), 'applications')

console.log('mypage home dashboard-stats.selfcheck: ok')
