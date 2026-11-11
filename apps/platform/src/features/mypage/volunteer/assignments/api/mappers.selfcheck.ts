import assert from 'node:assert/strict'
import { mapPortalVolunteerAssignments } from './mappers.ts'

const individual = mapPortalVolunteerAssignments(
  {
    programAudience: 'individual',
    assigned: [
      {
        id: 'a1',
        locationName: '서울특별시 강서구',
        distanceKm: 10.2,
        scheduleLines: [
          '2026년 01월 09일(금) 09:00~12:20 | 2차시',
          '2026년 01월 09일(금) 10:00~11:20 | 1차시',
        ],
      },
    ],
    waiting: [
      {
        id: 'w1',
        locationName: '서울특별시 양천구',
        distanceKm: 10,
        scheduleLine: '2026년 01월 09일(금) 09:00~12:20 | 2차시',
        assignmentStatus: 'WAITING',
      },
      {
        id: 'w2',
        locationName: '서울특별시 영등포구',
        distanceKm: null,
        scheduleLine: '2026년 01월 09일(금) 09:00~12:20 | 1차시',
        assignmentStatus: 'CANCELLED',
      },
    ],
  },
  'individual',
)

assert.equal(individual.audience, 'individual')
assert.equal(individual.data.assigned.length, 1)
assert.equal(individual.data.assigned[0]?.distanceFromHome, '10.2km')
assert.equal(individual.data.assigned[0]?.scheduleLines.length, 2)
assert.equal(individual.data.waiting.length, 2)
assert.equal(individual.data.waiting[0]?.assignmentStatus, 'waiting')
assert.equal(individual.data.waiting[1]?.distanceFromHome, '-')
assert.equal(individual.data.waiting[1]?.assignmentStatus, 'cancelled')

const org = mapPortalVolunteerAssignments(
  {
    programAudience: 'organization',
    assigned: [
      {
        id: 'o1',
        schoolName: '강서초등학교',
        educationGrade: '1학년',
        region: '서울특별시 강서구',
        distanceKm: 100,
        longDistance: true,
        scheduleLines: ['2026년 01월 09일(금) 09:00~12:20 | 1차시'],
      },
      {
        id: 'o2',
        schoolName: '양천초등학교',
        educationGrade: '2학년',
        region: '서울특별시 양천구',
        distanceKm: 250,
        longDistance: false,
        scheduleLines: ['2026년 01월 10일(토) 09:00~12:20 | 1차시'],
      },
    ],
    waiting: [],
  },
  'individual',
)

assert.equal(org.audience, 'organization')
assert.equal(org.data.assigned[0]?.distanceFromHome, '100km (장거리)')
assert.equal(org.data.assigned[1]?.distanceFromHome, '250km')

// 구버전 응답(sessionNo·sessionNos 키 없음) — 라벨 꼬리 「| N차시」(회차 번호)를 화면에 보이지 않는다
assert.ok(individual.data.assigned[0]?.scheduleLines.every(line => !/차시/.test(line)))
assert.ok(individual.data.waiting.every(row => !/차시/.test(row.scheduleLine)))
// 구버전: 필터는 기존처럼 라벨 꼬리 숫자로 — 마지막 참여 1회차면 꼬리 2인 줄은 숨김
const legacyWithdrawn = mapPortalVolunteerAssignments(
  {
    programAudience: 'individual',
    assigned: [
      {
        id: 'legacy',
        scheduleLines: [
          '2026년 01월 09일(금) 09:00~12:20 | 2차시',
          '2026년 01월 09일(금) 10:00~11:20 | 1차시',
        ],
      },
    ],
    waiting: [],
  },
  'individual',
  1,
)
assert.equal(legacyWithdrawn.data.assigned[0]?.scheduleLines.length, 1)

// N6 새 응답 — 회차는 sessionNo·sessionNos. 라벨 숫자를 읽지 않고, 화면은 「N회차」
const withRounds = mapPortalVolunteerAssignments(
  {
    programAudience: 'organization',
    assigned: [
      {
        id: 'assigned-org-701',
        schoolName: '강서초등학교',
        // 라벨 꼬리 숫자와 실제 회차가 달라도 sessionNos가 기준
        scheduleLines: [
          '2026.11.20(금) 09:00~12:00 | 1차시',
          '2026.11.27(금) 09:00~12:00 | 1차시',
          '2026.11.13(금) 09:00~12:00',
        ],
        scheduleIds: [1, 3, 9],
        sessionNos: [1, 3, null],
      },
    ],
    waiting: [
      {
        id: 'waiting-cancelled-62',
        scheduleId: 2,
        sessionNo: 2,
        scheduleLine: '2026.11.21(토) 09:00~12:00 | 2차시',
        assignmentStatus: 'CANCELLED',
      },
      {
        id: 'waiting-63',
        scheduleId: 4,
        sessionNo: 4,
        scheduleLine: '2026.12.04(금) 09:00~12:00 | 1차시',
        assignmentStatus: 'WAITING',
      },
      {
        id: 'waiting-pre',
        scheduleId: 5,
        sessionNo: null,
        scheduleLine: '2026.11.06(금) 09:00~12:00',
        assignmentStatus: 'WAITING',
      },
    ],
  },
  'organization',
  2,
)
assert.equal(withRounds.audience, 'organization')
// 마지막 참여 2회차 — 3회차 줄 숨김, 회차 없음(null) 줄은 숨기지 않음
assert.deepEqual(withRounds.data.assigned[0]?.scheduleLines, [
  '2026년 11월 20일(금) 09:00 ~ 12:00 | 1회차',
  '2026년 11월 13일(금) 09:00 ~ 12:00',
])
assert.ok(withRounds.data.assigned[0]?.scheduleLines.every(line => !/차시/.test(line)))
assert.deepEqual(
  withRounds.data.waiting.map(row => row.id),
  ['waiting-cancelled-62', 'waiting-pre'],
)
assert.ok(withRounds.data.waiting[0]?.scheduleLine.endsWith('| 2회차'))
assert.ok(!/회차|차시/.test(withRounds.data.waiting[1]?.scheduleLine ?? ''))
// 「0회차」를 만들지 않는다
const zeroRound = mapPortalVolunteerAssignments(
  {
    programAudience: 'individual',
    assigned: [],
    waiting: [
      { id: 'w0', sessionNo: 0, scheduleLine: '2026.11.06(금) 09:00~12:00', assignmentStatus: 'WAITING' },
    ],
  },
  'individual',
  1,
)
assert.equal(zeroRound.data.waiting.length, 1)
assert.ok(!/0회차/.test(zeroRound.data.waiting[0]?.scheduleLine ?? ''))

console.log('volunteer-assignments.mappers.selfcheck: ok')
