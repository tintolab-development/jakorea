import { describe, expect, it } from 'vitest'
import { resolveEducationColumns } from './program-table-column-resolver'

function columnKeys(
  columns: ReturnType<typeof resolveEducationColumns>
): Array<string | undefined> {
  return columns.map(column => (column.key == null ? undefined : String(column.key)))
}

describe('resolveEducationColumns trainedTeachers preset', () => {
  it('전체 탭에서 참여자 유형을 빼고 시안 컬럼만 남긴다', () => {
    expect(
      columnKeys(
        resolveEducationColumns({
          isOverviewListPage: true,
          listView: 'ALL',
          columnPreset: 'trainedTeachers',
        })
      )
    ).toEqual(['no', 'title', 'lifecycleProgress', 'participantCapacity', 'targetLevel'])
  })

  it('예정 탭에서 참여자 유형을 빼고 시안 컬럼만 남긴다', () => {
    expect(
      columnKeys(
        resolveEducationColumns({
          isOverviewListPage: true,
          listView: 'SCHEDULED',
          columnPreset: 'trainedTeachers',
        })
      )
    ).toEqual(['no', 'title', 'participantCapacity', 'targetLevel', 'operationPeriod'])
  })

  it('진행·완료 탭에서 강사·봉사자 모집과 참여자 유형을 뺀다', () => {
    const expected = [
      'no',
      'title',
      'participantCapacity',
      'participatingSchoolCount',
      'participatingStudentCount',
      'targetLevel',
    ]
    expect(
      columnKeys(
        resolveEducationColumns({
          isOverviewListPage: true,
          listView: 'IN_PROGRESS',
          columnPreset: 'trainedTeachers',
        })
      )
    ).toEqual(expected)
    expect(
      columnKeys(
        resolveEducationColumns({
          isOverviewListPage: true,
          listView: 'COMPLETED',
          columnPreset: 'trainedTeachers',
        })
      )
    ).toEqual(expected)
  })

  it('default preset은 참여자 유형·강사·봉사자 컬럼을 유지한다', () => {
    const keys = columnKeys(
      resolveEducationColumns({
        isOverviewListPage: true,
        listView: 'IN_PROGRESS',
      })
    )
    expect(keys).toContain('participantType')
    expect(keys).toContain('instructorRecruitment')
    expect(keys).toContain('volunteerRecruitment')
  })
})
