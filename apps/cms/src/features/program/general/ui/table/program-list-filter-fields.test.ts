import { describe, expect, it } from 'vitest'
import { programListOverviewFilterFields } from './program-list-filter-fields'

describe('programListOverviewFilterFields', () => {
  it('전체 탭 참여자 유형에 서버 계약의 4개 값을 모두 노출한다', () => {
    const field = programListOverviewFilterFields.find(item => item.key === 'participantType')

    expect(field?.options).toEqual([
      { value: 'school', label: '학교/기관' },
      { value: 'individual', label: '개인' },
      { value: 'instructor', label: '강사' },
      { value: 'volunteer', label: '봉사자' },
    ])
  })
})
