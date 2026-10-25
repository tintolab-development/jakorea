import { describe, expect, it } from 'vitest'
import { resolveProgramListDetailEntry } from './resolve-program-list-detail-entry'

describe('resolveProgramListDetailEntry', () => {
  it('진행 중 일반 프로그램은 신청 목록으로 연다', () => {
    expect(
      resolveProgramListDetailEntry({ lifecycleStatus: 'education_in_progress' })
    ).toEqual({ lnb: 'applicants', tab: 'institutions' })
  })

  it('완료 일반 프로그램은 참여자 목록으로 연다', () => {
    expect(resolveProgramListDetailEntry({ lifecycleStatus: 'completed' })).toEqual({
      lnb: 'progress',
      tab: 'institutions',
    })
  })

  it('1사1교 진행 중·완료는 기관 신청 목록으로 연다', () => {
    expect(
      resolveProgramListDetailEntry(
        { lifecycleStatus: 'completed' },
        { programType: 'company_school' }
      )
    ).toEqual({ lnb: 'applicants', tab: 'institutions' })
  })

  it('목록 위젯의 선택 상태를 canonical 상태보다 우선한다', () => {
    expect(
      resolveProgramListDetailEntry(
        { lifecycleStatus: 'scheduled' },
        { statusFilter: 'completed' }
      )
    ).toEqual({ lnb: 'progress', tab: 'institutions' })
  })
})
