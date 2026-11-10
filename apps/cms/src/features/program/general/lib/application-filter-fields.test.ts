import { describe, expect, it } from 'vitest'
import {
  generalInstructorApplicationFilterFields,
  generalInstructorCalendarFilterFields,
  generalOrganizationInstructorFilterFields,
} from './application-filter-fields'

describe('generalOrganizationInstructorFilterFields', () => {
  it('시안대로 리스트뷰와 같은 필터 키·순서를 쓴다', () => {
    expect(generalOrganizationInstructorFilterFields.map(f => f.key)).toEqual(
      generalInstructorApplicationFilterFields.map(f => f.key)
    )
    expect(generalOrganizationInstructorFilterFields.map(f => f.label)).toEqual([
      '신청 강사명',
      '자택 주소지',
      'JA 강의 경력',
      'JA 평가 등급',
      '프로그램 승인 현황',
    ])
  })

  it('자택 주소지는 리스트와 같은 시/도·시/군/구 키를 쓴다', () => {
    const region = generalOrganizationInstructorFilterFields.find(
      f => f.type === 'addressRegion'
    )
    expect(region?.addressRegion?.sidoKey).toBe('homeSido')
    expect(region?.addressRegion?.sigunguKey).toBe('homeSigungu')
  })

  it('기본 캘린더 필터(1사1교·개인형)는 바뀌지 않는다', () => {
    expect(generalInstructorCalendarFilterFields.map(f => f.label)).toEqual([
      '신청 기관명',
      '자택 소재지',
      '프로그램 승인 현황',
      '신청 학년',
      '신청 강사명',
    ])
  })
})
