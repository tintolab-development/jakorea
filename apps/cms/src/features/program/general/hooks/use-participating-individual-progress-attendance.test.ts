import { describe, expect, it } from 'vitest'
import { getProgressAttendanceViewState } from './use-participating-individual-progress-attendance'

describe('getProgressAttendanceViewState', () => {
  it('초기 로딩', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: true,
        isError: false,
        hasQueryData: false,
        sessionGroupCount: 0,
      })
    ).toEqual({ kind: 'loading' })
  })

  it('초기 조회 실패', () => {
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

  it('HTTP 200 빈 결과', () => {
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

  it('정상 데이터', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: false,
        hasQueryData: true,
        sessionGroupCount: 2,
      })
    ).toEqual({ kind: 'content', backgroundRefetchError: false })
  })

  it('stale 데이터 유지 + 백그라운드 재조회 실패', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: true,
        hasQueryData: true,
        sessionGroupCount: 2,
      })
    ).toEqual({ kind: 'content', backgroundRefetchError: true })
  })

  it('재시도 성공 후 정상 content', () => {
    expect(
      getProgressAttendanceViewState({
        remoteEnabled: true,
        isLoading: false,
        isError: false,
        hasQueryData: true,
        sessionGroupCount: 1,
      })
    ).toEqual({ kind: 'content', backgroundRefetchError: false })
  })
})
