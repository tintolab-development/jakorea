import { describe, expect, it } from 'vitest'
import { resolveTrainedTeachersListFilterFields } from './list-filter-fields'

describe('resolveTrainedTeachersListFilterFields', () => {
  it('전체 탭은 프로그램명·진행 현황·교육 대상만 둔다', () => {
    expect(resolveTrainedTeachersListFilterFields('ALL').map(field => field.key)).toEqual([
      'title',
      'lifecycleStatus',
      'targetLevel',
    ])
  })

  it('예정 탭은 프로그램명·교육 대상·사업 운영 기간만 둔다', () => {
    const fields = resolveTrainedTeachersListFilterFields('SCHEDULED')
    expect(fields.map(field => field.key)).toEqual(['title', 'targetLevel', 'operationPeriod'])
    expect(fields.find(field => field.key === 'operationPeriod')?.type).toBe('dateRange')
  })

  it('진행·완료 탭은 프로그램명·교육 대상만 둔다', () => {
    expect(resolveTrainedTeachersListFilterFields('IN_PROGRESS').map(field => field.key)).toEqual([
      'title',
      'targetLevel',
    ])
    expect(resolveTrainedTeachersListFilterFields('COMPLETED').map(field => field.key)).toEqual([
      'title',
      'targetLevel',
    ])
  })

  it('참여자 유형 필터를 두지 않는다', () => {
    const views = ['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const
    for (const view of views) {
      expect(resolveTrainedTeachersListFilterFields(view).some(field => field.key === 'participantType')).toBe(
        false
      )
    }
  })
})
