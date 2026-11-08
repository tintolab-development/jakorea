import assert from 'node:assert/strict'
import { formatUjatAssignmentDateLabel, mapPortalUjatClassAssignments } from './mappers.ts'

assert.equal(formatUjatAssignmentDateLabel('2026-11-20'), '2026.11.20(금)')
assert.equal(formatUjatAssignmentDateLabel('2026-04-03'), '2026.04.03(금)')
assert.equal(formatUjatAssignmentDateLabel(''), '')
assert.equal(mapPortalUjatClassAssignments({}).length, 0)
assert.equal(mapPortalUjatClassAssignments({ assigned: [], waiting: [] } as never).length, 0)
assert.equal(mapPortalUjatClassAssignments({ schedules: null } as never).length, 0)

const qa1691571 = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 187582,
      scheduleStartAt: '2026-11-20T00:00:00+09:00',
      date: '2026-11-20',
      attendanceManagerName: '마현우',
      consentDocumentsDownloadPath: null,
      rows: [
        {
          slotId: 183673,
          grade: '5',
          gradeLabel: '5학년',
          className: '1',
          classLabel: '1반',
          classNo: '1',
          volunteerAName: '이서연',
          volunteerBName: null,
          textbookName: 'UJAT 초등 경제교육 교재 05',
          studentCount: 20,
          textbookQuantity: 20,
          textbookQuantityLabel: '20권',
        },
        {
          slotId: 183674,
          grade: '5',
          gradeLabel: '5학년',
          className: '2',
          classLabel: '2반',
          classNo: '2',
          volunteerAName: '나영진',
          volunteerBName: '마현우',
          textbookName: 'UJAT 초등 경제교육 교재 05',
          studentCount: 20,
          textbookQuantity: 20,
          textbookQuantityLabel: '20권',
        },
      ],
    },
  ],
})

assert.equal(qa1691571.length, 1)
assert.equal(qa1691571[0].id, '187582')
assert.equal(qa1691571[0].dateLabel, '2026.11.20(금)')
assert.equal(qa1691571[0].attendanceManagerName, '마현우')
assert.equal(qa1691571[0].totalClassCount, 2)
assert.equal(qa1691571[0].consentDocumentsDownloadPath, null)
assert.equal(qa1691571[0].rows[0].gradeLabel, '5학년')
assert.equal(qa1691571[0].rows[0].classLabel, '1반')
assert.equal(qa1691571[0].rows[0].volunteerA, '이서연')
assert.equal(qa1691571[0].rows[0].volunteerB, '-')
assert.equal(qa1691571[0].rows[0].textbookName, 'UJAT 초등 경제교육 교재 05')
assert.equal(qa1691571[0].rows[0].textbookQuantityLabel, '20권')
assert.equal(qa1691571[0].rows[1].gradeLabel, '5학년')
assert.equal(qa1691571[0].rows[1].classLabel, '2반')
assert.equal(qa1691571[0].rows[1].volunteerA, '나영진')
assert.equal(qa1691571[0].rows[1].volunteerB, '마현우')
assert.equal(qa1691571[0].rows[1].textbookQuantityLabel, '20권')

const quantityWithoutStudentCount = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 187582,
      date: '2026-11-20',
      rows: [
        {
          slotId: 183673,
          gradeLabel: '5학년',
          classLabel: '1반',
          volunteerAName: '이서연',
          volunteerBName: null,
          textbookName: 'UJAT 초등 경제교육 교재 05',
          textbookQuantityLabel: '20권',
        },
      ],
    },
  ],
})
assert.equal(quantityWithoutStudentCount[0]?.rows[0]?.textbookQuantityLabel, '20권')

const grouped = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 11,
      date: '2026-04-03',
      scheduleStartAt: '2026-04-03T00:00:00+09:00',
      attendanceManagerName: '고종욱',
      consentDocumentsDownloadPath:
        '/api/portal/me/program-applications/ORGANIZATION/1/class-assignments/11/consent-documents',
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
assert.equal(grouped[0].consentDocumentsDownloadPath?.includes('consent-documents'), true)
assert.equal(grouped[0].rows[0].classLabel, '1반')
assert.equal(grouped[0].rows[0].gradeLabel, '1학년')
assert.equal(grouped[0].rows[0].gradeRowSpan, 2)
assert.equal(grouped[0].rows[0].volunteerA, '김제이')
assert.equal(grouped[0].rows[0].volunteerB, '-')
assert.equal(grouped[0].rows[1].gradeRowSpan, 0)
assert.equal(grouped[0].rows[1].classLabel, '2반')
assert.equal(grouped[0].rows[1].textbookQuantityLabel, '-')
assert.equal(grouped[0].rows[2].gradeLabel, '2학년')
assert.equal(grouped[0].rows[2].gradeRowSpan, 1)
assert.equal(grouped[0].rows[0].textbookQuantityLabel, '28권')
assert.equal(grouped[0].rows[2].textbookQuantityLabel, '28권')

const emptyNameDoesNotFallback = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 30,
      date: '2026-04-03',
      attendanceManagerName: '',
      rows: [
        {
          slotId: 1,
          gradeLabel: '1학년',
          classLabel: '1반',
          volunteerAName: '',
          volunteerA: '가짜A',
          volunteerBName: null,
          volunteerB: '실제B',
          textbookQuantityLabel: '',
          textbookQuantity: 10,
          studentCount: 99,
        },
      ],
    },
  ] as never,
})
assert.equal(emptyNameDoesNotFallback[0]?.attendanceManagerName, '-')
assert.equal(emptyNameDoesNotFallback[0]?.rows[0]?.volunteerA, '-')
assert.equal(emptyNameDoesNotFallback[0]?.rows[0]?.volunteerB, '-')
assert.equal(emptyNameDoesNotFallback[0]?.rows[0]?.textbookQuantityLabel, '-')

const ignoresFlatSlots = mapPortalUjatClassAssignments({
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
} as never)
assert.equal(ignoresFlatSlots.length, 0)

const emptySchedulesIgnoresFlat = mapPortalUjatClassAssignments({
  schedules: [],
  slots: [
    {
      scheduleId: 99,
      date: '2026-04-03',
      grade: '1',
      className: '9',
      volunteerAName: '가짜',
    },
  ],
} as never)
assert.equal(emptySchedulesIgnoresFlat.length, 0)

const dateWinsOverStartAt = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 12,
      scheduleStartAt: '2026-11-19T15:00:00.000Z',
      date: '2026-11-20',
      rows: [
        {
          slotId: 10,
          gradeLabel: '1',
          classNo: '2',
          volunteerAName: '김도영',
          volunteerBName: null,
          textbookName: null,
        },
      ],
    },
  ],
})
assert.equal(dateWinsOverStartAt[0]?.dateLabel, '2026.11.20(금)')
assert.equal(dateWinsOverStartAt[0]?.rows[0]?.classLabel, '2반')
assert.equal(dateWinsOverStartAt[0]?.rows[0]?.volunteerA, '-')
assert.equal(dateWinsOverStartAt[0]?.rows[0]?.volunteerB, '-')
assert.equal(dateWinsOverStartAt[0]?.rows[0]?.textbookName, '-')
assert.equal(dateWinsOverStartAt[0]?.attendanceManagerName, '-')

const startAtWithoutDateIsNotCalendar = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 13,
      scheduleStartAt: '2026-11-20T00:00:00+09:00',
      rows: [{ slotId: 1, gradeLabel: '5학년', classLabel: '1반', volunteerAName: '이서연' }],
    },
  ],
})
assert.equal(startAtWithoutDateIsNotCalendar[0]?.dateLabel, '-')

const combinedClassLabelIsNotCopied = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 14,
      date: '2026-11-20',
      rows: [
        {
          slotId: 1,
          gradeLabel: '5학년',
          classLabel: '5학년 1반',
          volunteerAName: '이서연',
        },
      ],
    },
  ],
})
assert.equal(combinedClassLabelIsNotCopied[0]?.rows[0]?.classLabel, '-')

const emptyConsentPathIsHidden = mapPortalUjatClassAssignments({
  schedules: [
    {
      scheduleId: 15,
      date: '2026-11-20',
      consentDocumentsDownloadPath: '',
      rows: [],
    },
  ],
})
assert.equal(emptyConsentPathIsHidden[0]?.consentDocumentsDownloadPath, null)
assert.equal(emptyConsentPathIsHidden[0]?.totalClassCount, 0)

console.log('ujat-assignments mappers.selfcheck: ok')
