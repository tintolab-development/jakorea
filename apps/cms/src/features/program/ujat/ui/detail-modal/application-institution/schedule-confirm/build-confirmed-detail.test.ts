import { describe, expect, it } from 'vitest'
import {
  buildEducationScheduleDaysFromTemporarySchedule,
  buildUjatScheduleConfirmConfirmedDetail,
} from './build-confirmed-detail'
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatInstitutionApplicationDetail } from '../detail/detail-types'

const row: UjatInstitutionApplicationRow = {
  id: '186101',
  regionKey: 'gwangju',
  no: 1,
  institutionName: '진월초등학교',
  tempAssignmentStatus: 'temp_assigned',
  gradeClassCounts: [{ gradeLabel: '1학년', classCount: 8 }],
  totalClassCount: 8,
  scheduleSlots: {},
  preferredScheduleIdByIso: {},
  sessionIsoDates: [],
  teacherName: '이길동',
  scheduleConfirmStatus: 'institution_confirmed',
  assignedInstructorCount: 2,
  operatingStudentCount: 202,
}

const baseDetail: UjatInstitutionApplicationDetail = {
  institutionName: '진월초등학교',
  regionLabel: '광주',
  tempAssignmentStatus: 'temp_assigned',
  address: '광주광역시 남구 광복마을4길 40',
  addressDetail: '1층 교무실 이길동 선생님 앞',
  teacherContact: {
    teacherName: '이길동',
    tel: '062-****-0000',
    mobile: '010-****-0000',
    email: 'ti***@naver.com',
  },
  otherRequests: '',
  gradeBlocks: [
    {
      gradeLabel: '1학년',
      classCount: 8,
      classes: [{ classNo: 1, studentCount: 28 }],
    },
    {
      gradeLabel: '2학년',
      classCount: 4,
      classes: [{ classNo: 1, studentCount: 28 }],
    },
  ],
  classTimeRows: [],
  preferredEducationDates: [],
}

describe('buildEducationScheduleDaysFromTemporarySchedule', () => {
  it('임시 일정 슬롯만 날짜·학급으로 묶고 로컬 store를 쓰지 않는다', () => {
    const days = buildEducationScheduleDaysFromTemporarySchedule({
      slots: [
        {
          scheduleStartAt: '2026-04-03T00:00:00+09:00',
          grade: '1학년',
          className: '1반',
        },
        {
          scheduleStartAt: '2026-04-03T00:00:00+09:00',
          classLabel: '1학년 2반',
        },
        {
          scheduleStartAt: '2026-04-17T00:00:00+09:00',
          classLabel: '2학년 1반',
        },
      ],
    })

    expect(days).toEqual([
      {
        dateLabel: '26년 4월 3일(금)',
        classLabels: ['1학년 1반', '1학년 2반'],
      },
      {
        dateLabel: '26년 4월 17일(금)',
        classLabels: ['2학년 1반'],
      },
    ])
  })

  it('슬롯이 없으면 빈 배열이다', () => {
    expect(buildEducationScheduleDaysFromTemporarySchedule(null)).toEqual([])
    expect(buildEducationScheduleDaysFromTemporarySchedule({ slots: [] })).toEqual([])
  })
})

describe('buildUjatScheduleConfirmConfirmedDetail', () => {
  it('교재·안내는 상세 API 값만 쓰고 학년 기본 교재를 채우지 않는다', () => {
    const detail = buildUjatScheduleConfirmConfirmedDetail(row, baseDetail, {
      organizationName: '진월초등학교',
      educationRegionCode: 'GWANGJU',
      organizationAddress: '광주광역시 남구 광복마을4길 40',
      organizationAddressDetail: '1층 교무실',
      textbookName: '우리가족',
      textbookGrade: '1학년',
      textbookKits: 9,
      textbookQuantity: 216,
      computerInRoom: '6학년 개별 태블릿 사용 가능',
      waitingRoomLocation: '후관2층 1-4 열 강사대기실',
      mealNotice: '후관1층 세면대 옆',
      parkingInfo: '본교 주차장 이용',
      snackAvailability: 'possible',
      sexOffenseCheckRequest: '온라인 제출 | ID : tinto | 검증번호 : 940412',
      scheduleConfirmStatus: 'institution_confirmed',
    } as never)

    expect(detail?.gradeEducationBlocks[0]?.textbook).toEqual({
      textbookName: '우리가족',
      kitSummary: '9키트 (216권)',
      deliveryStatus: null,
    })
    expect(detail?.gradeEducationBlocks[1]?.textbook).toBeNull()
    expect(detail?.guidanceNotes).toEqual({
      searchDeviceGrade6: '6학년 개별 태블릿 사용 가능',
      waitingArea: '후관2층 1-4 열 강사대기실',
      textbookDisposalLocation: '후관1층 세면대 옆',
      otherSpecialNotes: '본교 주차장 이용',
      snackAvailability: '가능',
      sexOffenderCheck: '온라인 제출 | ID : tinto | 검증번호 : 940412',
    })
    expect(detail?.educationScheduleDays).toEqual([])
  })

  it('안내 필드가 없으면 - 이고 기본 교재명으로 채우지 않는다', () => {
    const detail = buildUjatScheduleConfirmConfirmedDetail(row, baseDetail, {
      organizationName: '진월초등학교',
      computerInRoom: null,
      waitingRoomLocation: null,
      mealNotice: null,
      parkingInfo: null,
    })

    expect(detail?.gradeEducationBlocks.every(block => block.textbook == null)).toBe(true)
    expect(detail?.guidanceNotes.searchDeviceGrade6).toBe('-')
    expect(detail?.guidanceNotes.waitingArea).toBe('-')
    expect(detail?.guidanceNotes.textbookDisposalLocation).toBe('-')
    expect(detail?.guidanceNotes.snackAvailability).toBe('-')
    expect(detail?.guidanceNotes.sexOffenderCheck).toBe('-')
  })
})
