import assert from 'node:assert/strict'
import { formatUjatAssignmentDateLabel, mapPortalUjatClassAssignments } from './mappers.ts'

assert.equal(formatUjatAssignmentDateLabel('2026-04-03'), '2026.04.03(금)')
assert.equal(formatUjatAssignmentDateLabel(''), '')
assert.equal(mapPortalUjatClassAssignments({}).length, 0)
assert.equal(mapPortalUjatClassAssignments({ assigned: [], waiting: [] } as never).length, 0)

const grouped = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 11,
      scheduleStartAt: '2026-04-03T00:00:00+09:00',
      attendanceManagerName: '고종욱',
      consentDocumentsDownloadPath: '/api/portal/me/program-applications/ORGANIZATION/1/class-assignments/11/consent-documents',
      rows: [
        {
          slotId: 1,
          grade: '1',
          className: '2',
          volunteerAName: '김도영',
          volunteerBName: '김호령',
          textbookName: '우리가족',
          studentCount: 28,
        },
        {
          slotId: 2,
          grade: '1',
          className: '1',
          volunteerAName: '김제이',
          volunteerBName: '',
          textbookName: '우리가족',
          textbookQuantity: 28,
        },
        {
          slotId: 3,
          grade: '2',
          classLabel: '1반',
          volunteerAName: '김제이',
          volunteerBName: '곽도규',
          textbookName: '우리마을',
          textbookQuantityLabel: '28권',
        },
      ],
    },
  ],
})

assert.equal(grouped.length, 1)
assert.equal(grouped[0].dateLabel, '2026.04.03(금)')
assert.equal(grouped[0].attendanceManagerName, '고종욱')
assert.equal(grouped[0].totalClassCount, 3)
assert.equal(grouped[0].rows[0].classLabel, '1반')
assert.equal(grouped[0].rows[0].gradeLabel, '1학년')
assert.equal(grouped[0].rows[0].gradeRowSpan, 2)
assert.equal(grouped[0].rows[0].volunteerA, '김제이')
assert.equal(grouped[0].rows[0].volunteerB, '-')
assert.equal(grouped[0].rows[1].gradeRowSpan, 0)
assert.equal(grouped[0].rows[1].classLabel, '2반')
assert.equal(grouped[0].rows[2].gradeLabel, '2학년')
assert.equal(grouped[0].rows[2].gradeRowSpan, 1)
assert.equal(grouped[0].rows[0].textbookQuantityLabel, '28권')

const flat = mapPortalUjatClassAssignments({
  slots: [
    {
      scheduleId: 21,
      scheduleStartAt: '2026-04-17',
      attendanceManagerName: '김도영',
      grade: '1학년',
      classNo: 1,
      volunteerA: '김제이',
      volunteerB: '곽도규',
      textbookName: '우리가족',
      textbookQuantity: 28,
    },
  ],
})
assert.equal(flat[0]?.dateLabel, '2026.04.17(금)')
assert.equal(flat[0]?.rows[0]?.classLabel, '1반')

console.log('ujat-assignments mappers.selfcheck: ok')
