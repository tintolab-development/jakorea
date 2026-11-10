import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
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

  it('교육 대상 컬럼은 targetLevels 전체를 조인한다', () => {
    const columns = resolveEducationColumns({
      isOverviewListPage: true,
      listView: 'ALL',
      columnPreset: 'trainedTeachers',
    })
    const column = columns.find(item => item.key === 'targetLevel')
    const record = {
      targetLevel: 'university',
      targetLevels: ['university', 'middle', 'high'],
    } as Program

    expect(column?.render?.(undefined, record, 0)).toBe('대학(원)생, 중학교, 고등학교')
  })

  it('교육 대상 컬럼은 다중 대상 표시를 위한 최소 폭과 말줄임을 사용한다', () => {
    const columns = resolveEducationColumns({
      isOverviewListPage: true,
      listView: 'ALL',
    })
    const column = columns.find(item => item.key === 'targetLevel') as
      | { minWidth?: number; ellipsis?: boolean }
      | undefined

    expect(column?.minWidth).toBe(220)
    expect(column?.ellipsis).toBe(true)
  })

  it('교육받은 교사도 참여자 모집 인원은 승인 건수와 정원을 함께 표시한다', () => {
    const columns = resolveEducationColumns({
      isOverviewListPage: true,
      listView: 'ALL',
      columnPreset: 'trainedTeachers',
    })
    const column = columns.find(item => item.key === 'participantCapacity')
    const record = {
      approvedStudentCount: 99,
      participatingStudentCount: 240,
      participatingSchoolCount: 12,
      participantApprovedCount: 1,
      participantCapacity: 120,
    } as Program

    expect(column?.render?.(undefined, record, 0)).toBe('1 / 120')
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

  it('default preset 참여자 모집 인원은 승인 인원과 정원을 함께 표시한다', () => {
    const columns = resolveEducationColumns({
      isOverviewListPage: true,
      listView: 'ALL',
    })
    const column = columns.find(item => item.key === 'participantCapacity')
    const record = {
      approvedStudentCount: 9,
      participantApprovedCount: 1,
      participantCapacity: 120,
      rounds: [{ capacity: 40 }],
    } as unknown as Program

    expect(column?.render?.(undefined, record, 0)).toBe('1 / 120')
  })

  it('정원이 없으면 유형과 관계없이 승인 건수 / - 로 표시한다', () => {
    for (const columnPreset of [undefined, 'trainedTeachers' as const]) {
      const columns = resolveEducationColumns({
        isOverviewListPage: true,
        listView: 'ALL',
        columnPreset,
      })
      const column = columns.find(item => item.key === 'participantCapacity')
      const record = {
        participantApprovedCount: 4,
        participantCapacity: undefined,
        generalVolunteers: 80,
      } as Program

      expect(column?.render?.(undefined, record, 0)).toBe('4 / -')
    }
  })
})

describe('resolveEducationColumns general preset', () => {
  const record = { startDate: '2026-12-08', endDate: '2026-12-30' } as unknown as Program

  it('예정 탭 사업 운영 기간을 요일과 함께 표시한다 (일반 프로그램 시안)', () => {
    const columns = resolveEducationColumns({
      isOverviewListPage: true,
      listView: 'SCHEDULED',
      columnPreset: 'general',
    })
    const column = columns.find(item => item.key === 'operationPeriod')
    expect(column?.render?.(undefined, record, 0)).toBe('2026.12.08(화) ~ 2026.12.30(수)')
  })

  it('default preset 예정 탭 기간은 기존처럼 요일 없이 표시한다', () => {
    const columns = resolveEducationColumns({ isOverviewListPage: true, listView: 'SCHEDULED' })
    const column = columns.find(item => item.key === 'operationPeriod')
    expect(column?.render?.(undefined, record, 0)).toBe('2026.12.08 ~ 2026.12.30')
  })
})
