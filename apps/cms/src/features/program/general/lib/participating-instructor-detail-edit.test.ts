import { describe, expect, it } from 'vitest'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { rowToParticipatingInstructorEditDraft } from './participating-instructor-detail-edit'

const row = (lectureFeeBasisDisplay: string) =>
  ({ id: 'p-1', lectureFeeBasisDisplay }) as ParticipatingInstructorRow

describe('참여 강사 상세 지급 기준 파싱', () => {
  it('1사1교 라벨 「차시당」은 값 `1시간 당`으로 읽는다', () => {
    expect(rowToParticipatingInstructorEditDraft(row('특강 강사비 | 차시당 | 50,000원')).lectureFeeMeasure).toBe(
      '1시간 당'
    )
  })

  it('기존 값 표기는 그대로', () => {
    expect(rowToParticipatingInstructorEditDraft(row('특강 강사비 | 1시간 당 | 50,000원')).lectureFeeMeasure).toBe(
      '1시간 당'
    )
    expect(rowToParticipatingInstructorEditDraft(row('특강 강사비 | 출강 1회당 | 50,000원')).lectureFeeMeasure).toBe(
      '출강 1회당'
    )
  })
})

describe('참여 강사 상세 지급 기준 — 예전 라벨·금액 왕복', () => {
  it('예전 라벨(1회 기준·1시간 기준)도 값으로 읽고, 「출강 1회당」의 1을 금액으로 읽지 않는다', () => {
    const once = rowToParticipatingInstructorEditDraft(row('특강 강사비 | 1회 기준 | 50,000원'))
    expect(once.lectureFeeMeasure).toBe('출강 1회당')
    expect(once.lectureFeeAmount).toBe('50000')
    expect(rowToParticipatingInstructorEditDraft(row('기타 인건비 | 1시간 기준 | 30,000원')).lectureFeeMeasure).toBe(
      '1시간 당'
    )
    expect(rowToParticipatingInstructorEditDraft(row('특강 강사비 | 출강 1회당 | 50,000원')).lectureFeeAmount).toBe(
      '50000'
    )
  })
})
