import { describe, expect, it } from 'vitest'
import { getProgressAttendanceViewState } from './use-participating-individual-progress-attendance'

/** 기관 출석은 진행 현황과 동일한 view-state 정책을 사용한다. */
describe('useSchoolDetailAttendance view state (shared policy)', () => {
  it('초기 조회 실패는 load_error', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: true,
        hasQueryData: false,
        sessionGroupCount: 0,
      })
    ).toEqual({ kind: 'load_error' })
  })

  it('HTTP 200 빈 결과는 empty', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: false,
        hasQueryData: true,
        sessionGroupCount: 0,
      })
    ).toEqual({ kind: 'empty' })
  })

  it('stale 데이터 + 백그라운드 재조회 실패', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: true,
        hasQueryData: true,
        sessionGroupCount: 1,
      })
    ).toEqual({ kind: 'content', backgroundRefetchError: true })
  })
})
