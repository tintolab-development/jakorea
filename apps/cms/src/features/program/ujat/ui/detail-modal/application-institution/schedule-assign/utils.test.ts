import { describe, expect, it } from 'vitest'
import { buildGradeOptionsForInstitution, listAssignableSchoolsForDate } from './utils'
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
