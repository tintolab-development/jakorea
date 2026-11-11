import { describe, expect, it } from 'vitest'
import {
  buildParticipatingParticipantCertificateContext,
  toCertificateStudentGender,
  toParticipatingParticipantCertificateStudent,
} from '@/features/program/general/lib/participating-individual-participant-certificate'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'

/** Step 6.2 — 증명서용 학생 행 성별: 확인되지 않은 값을 다른 성별로 추정하지 않는다(가짜 데이터, 실제 발급 없음). */

function participant(gender: string | null | undefined): ParticipatingIndividualParticipantRow {
  return {
    id: 'p-1',
    no: 1,
    applicantName: '김참가',
    affiliation: '가나고등학교',
    detail: { gender, birthDate: '2008-05-01', affiliationGrade: '2학년' },
    lectureAttendanceSessions: [],
  } as unknown as ParticipatingIndividualParticipantRow
}

describe('toCertificateStudentGender', () => {
  it.each([
    ['남성', 'male'],
    ['MALE', 'male'],
    ['M', 'male'],
    ['여성', 'female'],
    ['FEMALE', 'female'],
    ['F', 'female'],
  ])('확인된 성별 %s → %s', (input, expected) => {
    expect(toCertificateStudentGender(input)).toBe(expected)
  })

  it.each([[null], [undefined], [''], ['   '], ['UNKNOWN'], ['X'], ['**'], ['-']])(
    '확인되지 않은 성별 %s 은 undefined (남성·여성 추정 금지)',
    input => {
      expect(toCertificateStudentGender(input)).toBeUndefined()
    }
  )
})

describe('일반 참여자 증명서 학생 행', () => {
  it('미등록·마스킹 성별은 남성으로 바뀌지 않는다', () => {
    expect(toParticipatingParticipantCertificateStudent(participant(null)).gender).toBeUndefined()
    expect(toParticipatingParticipantCertificateStudent(participant('**')).gender).toBeUndefined()
    expect(toParticipatingParticipantCertificateStudent(participant('여성')).gender).toBe('female')
    expect(toParticipatingParticipantCertificateStudent(participant('남성')).gender).toBe('male')
  })

  it('정상 발급 데이터(이름·생년월일·소속)는 그대로 유지된다', () => {
    const ctx = buildParticipatingParticipantCertificateContext({
      participant: participant(null),
      program: { id: 'prog-1', title: '경제교육', startDate: '2026-03-01', endDate: '2026-03-31' } as unknown as Program,
      issuanceReasonLabel: '수료증 발급',
      certificateKind: 'completion',
    })
    expect(ctx.student.name).toBe('김참가')
    expect(ctx.student.birthDate).toBeTruthy()
    expect(ctx.student).not.toHaveProperty('gender')
  })
})
