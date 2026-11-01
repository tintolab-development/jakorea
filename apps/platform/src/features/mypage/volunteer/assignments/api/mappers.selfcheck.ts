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

console.log('volunteer-assignments.mappers.selfcheck: ok')
