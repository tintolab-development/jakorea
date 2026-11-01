import assert from 'node:assert/strict'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
import { buildAssignedSettlementItems } from './assigned-settlement-items.ts'

const NOW = new Date('2026-11-01T09:00:00+09:00')

function sessionMetaOf(input: Partial<EducationScheduleItem>): string | undefined {
  return buildAssignedSettlementItems({
    schedules: [
      {
        id: '1',
        scheduleId: 1,
        sessionNumber: 1,
        heldAt: '2026-10-31T12:20:00Z',
        endAt: '2026-10-31T12:22:00Z',
        title: '-',
        attendanceStatus: null,
        sessionLabel: '1차시',
        ...input,
      },
    ],
    scopeStatus: 'ASSIGNMENT_SCOPED',
    now: NOW,
    programId: '100',
  })[0]?.sessionMeta
}

// 날짜로 시작하는 진행 시간 라벨은 날짜 중복을 막기 위해 시간만 사용
assert.equal(
  sessionMetaOf({ progressTimeLabel: '2026년 10월 31일(토) 21:20 ~ 21:22' }),
  '21:20~21:22 1차시',
)
// 시간만 있는 라벨은 그대로 사용
assert.equal(sessionMetaOf({ progressTimeLabel: '10:00~11:20' }), '10:00~11:20 1차시')
// 라벨이 없으면 heldAt~endAt 시간
assert.equal(sessionMetaOf({}), '21:20~21:22 1차시')

console.log('assigned-settlement-session-meta selfcheck ok')
