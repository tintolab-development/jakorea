import { describe, expect, it } from 'vitest'
import {
  buildGradeOptionsForInstitution,
  collectScheduleAssignPendingInstitutionNames,
  computeVolunteerEducationDays,
  isScheduleAssignBlockedInstitution,
  listAssignableSchoolsForDate,
} from './utils'
import type { UjatInstitutionApplicationRow } from '../list/types'

function row(
  patch: Partial<UjatInstitutionApplicationRow> & Pick<UjatInstitutionApplicationRow, 'id'>
): UjatInstitutionApplicationRow {
  return {
    regionKey: 'gyeonggi_south',
    no: 1,
    institutionName: 'UJAT 테스트 기관',
    tempAssignmentStatus: 'evaluation_pending',
    gradeClassCounts: [{ gradeLabel: '1학년', classCount: 2 }],
    totalClassCount: 2,
    scheduleSlots: { '2027-04-30': 'O' },
    preferredScheduleIdByIso: {},
    sessionIsoDates: [],
    teacherName: '-',
    ...patch,
  }
}

describe('buildGradeOptionsForInstitution', () => {
  it('classes가 비어도 classCount로 1반·2반 옵션을 만든다', () => {
    const options = buildGradeOptionsForInstitution(
      row({ id: '1691444', gradeClassCounts: [{ gradeLabel: '1학년', classCount: 2 }] })
    )
    expect(options.map(option => option.label)).toEqual(['1학년 1반', '1학년 2반'])
  })
})

describe('listAssignableSchoolsForDate', () => {
  it('평가 대기(SUBMITTED) 기관도 희망일이면 옵션에 넣는다', () => {
    const schools = listAssignableSchoolsForDate(
      [row({ id: '1691444' })],
      'gyeonggi_south',
      '2027-04-30'
    )
    expect(schools.map(item => item.id)).toEqual(['1691444'])
  })

  it('희망일이 아니거나 반려된 기관은 제외한다', () => {
    const schools = listAssignableSchoolsForDate(
      [
        row({ id: 'a', scheduleSlots: { '2027-04-30': '-' } }),
        row({ id: 'b', tempAssignmentStatus: 'application_rejected' }),
        row({ id: 'c', tempAssignmentStatus: 'temp_rejected' }),
      ],
      'gyeonggi_south',
      '2027-04-30'
    )
    expect(schools).toEqual([])
  })
})

describe('collectScheduleAssignPendingInstitutionNames', () => {
  it('학급이 선택된 기관만 첫 등장 순으로 모은다', () => {
    expect(
      collectScheduleAssignPendingInstitutionNames(
        {
          a: {
            rows: [
              { institutionRowId: '1', gradeValues: ['1-1'] },
              { institutionRowId: '2', gradeValues: [] },
            ],
          },
          b: {
            rows: [{ institutionRowId: '1', gradeValues: ['2-1'] }],
          },
        },
        { '1': 'A초', '2': 'B초' }
      )
    ).toEqual(['A초'])
  })
})

describe('isScheduleAssignBlockedInstitution', () => {
  it('신청 반려·임시 반려 기관만 배정 불가로 본다', () => {
    expect(isScheduleAssignBlockedInstitution({ tempAssignmentStatus: 'application_rejected' })).toBe(
      true
    )
    expect(isScheduleAssignBlockedInstitution({ tempAssignmentStatus: 'temp_rejected' })).toBe(true)
    expect(isScheduleAssignBlockedInstitution({ tempAssignmentStatus: 'temp_assigned' })).toBe(false)
    expect(isScheduleAssignBlockedInstitution({ tempAssignmentStatus: 'evaluation_pending' })).toBe(
      false
    )
  })
})

describe('computeVolunteerEducationDays', () => {
  it('봉사단 인원 입력이 비어 NaN이면 계산하지 않는다', () => {
    expect(computeVolunteerEducationDays(10, Number.parseInt('', 10))).toBeNull()
    expect(computeVolunteerEducationDays(Number.NaN, 3)).toBeNull()
  })

  it('입력값이 0이면 계산하지 않고, 모두 있으면 일수를 반올림한다', () => {
    expect(computeVolunteerEducationDays(10, 0)).toBeNull()
    expect(computeVolunteerEducationDays(0, 3)).toBeNull()
    expect(computeVolunteerEducationDays(10, 3)).toBe(7)
  })
})
